from typing import *

import uszipcode
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.staticfiles import finders
from django.contrib.staticfiles.storage import staticfiles_storage
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views import View

from io import BytesIO
import cv2
import numpy as np
import hashlib
from argon2 import PasswordHasher
from fighthealthinsurance.forms import *
from fighthealthinsurance.models import *
from fighthealthinsurance.process_denial import *
from fighthealthinsurance.utils import *


class IndexView(View):
    def get(self, request):
        return render(
            request,
            'index.html')


class ScanView(View):
    def get(self, request):
        return render(
            request,
            'scrub.html',
            context={
                'ocr_result': '',
                'upload_more': True
            })


class PrivacyPolicyView(View):
    def get(self, request):
        return render(
            request,
            'privacy_policy.html',
            context={
                'title': "Privacy Policy"
            })


class TermsOfServiceView(View):
    def get(self, request):
        return render(
            request,
            'tos.html',
            context={
                'title': "Terms of Service",
            })



class OptOutView(View):
    def get(self, request):
        return render(
            request,
            'opt_out.html',
            context={
                'title': "Opt Out",
            })


class RemoveDataView(View):
    def get(self, request):
        return render(
            request,
            'remove_data.html',
            context={
                'title': "Remove My Data",
            })


class RecommendAppeal(View):
    def post(self, request):
        return render(request, '')


states_with_caps = {
    "AR", "CA", "CT", "DE", "DC", "GA",
    "IL", "IA", "KS", "KY", "ME", "MD",
    "MA", "MI", "MS", "MO", "MT", "NV",
    "NH", "NJ", "NM", "NY", "NC", "MP",
    "OK", "OR", "PA", "RI", "TN", "TX",
    "VT", "VI", "WV"}

class FindNextSteps(View):
    def post(self, request):
        form = PostInferedForm(request.POST)
        if form.is_valid():
            denial_id = form.cleaned_data["denial_id"]
            email = form.cleaned_data['email']
            hashed_email = hashlib.sha512(email.encode("utf-8")).hexdigest()
            print(f"di {denial_id} he {hashed_email}")
            denial = Denial.objects.filter(
                denial_id = denial_id,
                hashed_email = hashed_email).get()

            outside_help_details = ""
            state = form.cleaned_data["your_state"]
            if state in states_with_caps:
                outside_help_details += (
                    "<a href='https://www.cms.gov/CCIIO/Resources/Consumer-Assistance-Grants/" +
                    state +
                    "'>" +
                    f"Your state {state} participates in a" +
                    f"Consumer Assistance Program(CAP), and you may be able to get help " +
                    f"through them.</a>")
            if denial.regulator == Regulator.objects.filter(alt_name="ERISA").get():
                outside_help_details = (
                    "Your plan looks to be an ERISA plan which means your employer <i>may</i>" +
                    " have more input into plan decisions. If your are on good terms with HR " +
                    " it could be worth it to ask them for advice.")
            denial.insurance_company = form.cleaned_data["insurance_company"]
            denial.plan_id = form.cleaned_data["plan_id"]
            denial.claim_id = form.cleaned_data["claim_id"]
            denial.pre_service = form.cleaned_data["pre_service"]
            if "denial_type_text" in form.cleaned_data:
                denial.denial_type_text = form.cleaned_data["denial_type_text"]
            denial.denial_type.set(form.cleaned_data["denial_type"])
            denial.state = form.cleaned_data["your_state"]
            denial.save()
            advice = []
            question_forms = {}
            medically_necessary = DenialTypes.objects.get(name="Medically Necessary")
            step_therapy = DenialTypes.objects.get(name="STEP Therapy -- have to try cheaper options first")
            
            for dt in denial.denial_type.all():
                if dt.pk == medically_necessary:
                    question_forms += MedicalNeccessaryQuestions
                if dt.parent == medically_necessary:
                    question_forms += MedicalNeccessaryQuestions
                if dt == step_therapy:
                    question_forms += StepTherapyQuestions
#                if dt == provider_bill:
#                    question_forms += BalanceBillQuestions
            print(f"Questions {question_forms}")
            denial_ref_form = DenialRefForm(
                initial = {
                    'denial_id': denial.denial_id,
                    "email": form.cleaned_data['email']
                }
            )
            return render(
                request,
                'outside_help.html',
                context={
                    "outside_help_details": outside_help_details,
                    "forms": question_forms,
                    "denial_form": denial_ref_form,
                })
        else:
            print(f"Invalid form. {form}")
            # If not valid take the user back.
            return render(
                request,
                'categorize.html',
                context = {
                    'post_infered_form': form,
                    'upload_more': True,
                })


class GenerateAppeal(View):

    def post(self, request):
        form = DenialRefForm(request.POST)
        if form.is_valid():
            denial_id = form.cleaned_data["denial_id"]
            email = form.cleaned_data['email']
            hashed_email = hashlib.sha512(email.encode("utf-8")).hexdigest()
            print(f"di {denial_id} he {hashed_email}")
            denial = Denial.objects.filter(
                denial_id = denial_id,
                hashed_email = hashed_email).get()
            insurance_company = denial.insurance_company or "insurance company;"
            claim_id = denial.claim_id or "YOURCLAIMIDGOESHERE"
            denial_date_info = ""
            if denial.denial_date is not None:
                denial_date_info = "on or about {denial.denial_date}"

            initial_appeal_text = f"""
Dear {insurance_company};

My name is $your_name_here and I am writing you regarding claim {claim_id}{denial_date_info}. I believe this claim has been incorrectly processed. I would am requestting an internal appeal."""

            for dt in denial.denial_type.all():
                if dt.appeal_text is not None:
                    initial_appeal_text += "\n" + dt.appeal_text

            footer = "Additionally, I request all documents involved in this claim, including but not limited to plan documents, qualifications of individuals involved (both in the decision and in creation of policies), any policies policies, procedures, and any related communications. If you are not the plan administrator, forward this request to the plan administrator (and tell me who is the plan administrator so I may follow up with them)."
            if not denial.pre_service:
                footer += "As a post-service claim I believe you have ~60 days to respond."
            elif not denial.urgent:
                footer += "As non-urgent pre-service claim I believe you ~30 days to respond."
            else:
                footer += "As an urgent pre-service claim you must respond within the timeline required for my medical situation (up to a maximum of four days). This also serves as notice of concurrent request of external review."
            return render(
                request,
                'appeal.html',
                context={
                    "appeal": initial_appeal_text + footer 
                })


class OCRView(View):
    def __init__(self):
        from doctr.models import ocr_predictor
        self.model = ocr_predictor(
            det_arch='db_resnet50', reco_arch='crnn_vgg16_bn', pretrained=True)

    def get(self, request):
        return render(
            request,
            'server_side_ocr.html')

    def post(self, request):
        from doctr.io import DocumentFile
        txt = ""
        print(request.FILES)
        files = dict(request.FILES.lists())
        uploader = files['uploader']
        doc_txt = self.ocr_with_tesseract(uploader)
        return render(
            request,
            'scrub.html',
            context={
                'ocr_result': doc_txt,
                'upload_more': False
            })


    def ocr_with_kraken(self, uploader):
        from kraken import binarization
        from kraken.lib import models
        from PIL import Image
        images = list(map(
            lambda x: Image(x.read())), uploader)
        return ""

    def ocr_with_tesseract(self, uploader):
        np_files = list(map(
            lambda x: np.frombuffer(x.read(), dtype=np.uint8),
            uploader))
        imgs = list(map(
            lambda npa: cv2.imdecode(npa, cv2.IMREAD_COLOR),
            np_files))
        result = self.model(imgs)
        print(result)
        words = map(
            lambda words: words['value'],
            flat_map(
                lambda lines: lines['words'],
                flat_map(
                    lambda block: block['lines'],
                    flat_map(
                        lambda page: page['blocks'], result.export()['pages']))))
        doc_txt = " ".join(words)
        return doc_txt


class ProcessView(View):
    def __init__(self):
        self.regex_denial_processor = ProcessDenialRegex()
        self.codes_denial_processor = ProcessDenialCodes()
        self.regex_src = DataSource.objects.get(name="regex")
        self.codes_src = DataSource.objects.get(name="codes")
        self.zip_engine = uszipcode.search.SearchEngine()


    def post(self, request):
        form = DenialForm(request.POST)
        if form.is_valid():
            # It's not a password per-se but we want password like hashing.
            # but we don't support changing the values.
            email = form.cleaned_data['email']
            hashed_email = hashlib.sha512(email.encode("utf-8")).hexdigest()
            denial_text = form.cleaned_data['denial_text']
            print(denial_text)
            denial = Denial(
                denial_text = denial_text,
                hashed_email = hashed_email)
            denial.save()
            denial_types = self.regex_denial_processor.get_denialtype(denial_text)
            print(f"mmmk {denial_types}")
            denial_type = []
            for dt in denial_types:
                DenialTypesRelation(
                    denial=denial,
                    denial_type=dt,
                    src=self.regex_src).save()
                denial_type.append(dt)
            denial_types = self.codes_denial_processor.get_denialtype(denial_text)
            print(f"mmmk {denial_types}")
            for dt in denial_types:
                DenialTypesRelation(
                    denial=denial,
                    denial_type=dt,
                    src=self.codes_src).save()
                denial_type.append(dt)
            print(f"denial_type {denial_type}")
            plan_type = self.codes_denial_processor.get_plan_type(denial_text)
            print(f"plan {plan_type}")
            state = None
            zip = form.cleaned_data['zip']
            if  zip is not None and zip != "":
                print(f"zip {zip}")
                state = self.zip_engine.by_zipcode(
                    form.cleaned_data['zip']).state
            form = PostInferedForm(
                initial = {
                    'denial_type': denial_type,
                    'denial_id': denial.denial_id,
                    'email': email,
                    'your_state': state,
                })
            return render(
                request,
                'categorize.html',
                context = {
                    'post_infered_form': form,
                    'upload_more': True,
                })
        else:
            return render(
                request,
                'scrub.html',
                context={
                    'error': form.errors,
                    '': request.POST.get('denial_text', ''),
                })
