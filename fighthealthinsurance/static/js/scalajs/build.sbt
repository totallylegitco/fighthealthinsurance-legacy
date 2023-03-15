enablePlugins(ScalaJSPlugin)

name := "FightHealthInsuranceFrontend"
scalaVersion := "2.13.10"

// This is an application with a main method
scalaJSUseMainModuleInitializer := true

libraryDependencies += "org.scala-js" %%% "scalajs-dom" % "2.1.0"


// Add support for the DOM in `run` and `test`
jsEnv := new org.scalajs.jsenv.jsdomnodejs.JSDOMNodeJSEnv()

enablePlugins(ScalaJSBundlerPlugin)

scalaJSUseMainModuleInitializer := true

// uTest settings
libraryDependencies += "com.lihaoyi" %%% "utest" % "0.8.1" % "test"
testFrameworks += new TestFramework("utest.runner.Framework")

// ScalablyTypedconverterplugin is GPLv3 licensed
enablePlugins(ScalablyTypedConverterPlugin)


Compile / npmDependencies ++= Seq(
  "@pdfme/generator" -> "1.1.9",
  "pdfjs-dist" -> "3.4.120",
  "tesseract.js" -> "4.0.2",
)
