from django import forms
from captcha.fields import ReCaptchaField

class DenialForm(forms.Form):
    email = forms.CharField(
        label="E-mail (you can choose how we store):",
        max_length=300,
        widget=forms.EmailInput)
    denial_text = forms.CharField(
        label="Health Insurance Denial Text",
        max_length=30000,
        widget=forms.Textarea)
    pii = forms.BooleanField(
        required=True,
        label="I have removed my PII from the text area above",
        )
    store_raw_email = forms.BooleanField(
        required=False,
        label="Store my raw e-mail to follow up with me (for the duration of automated follow ups + 30 days)",
        initial=True)
    privacy = forms.BooleanField(required=True,
                                 label="I have read and understand the privacy policy")
    zip = forms.CharField(
        max_length=30,
        label="Your zip code (Transfered to server, we do not store outside of session)")                  
