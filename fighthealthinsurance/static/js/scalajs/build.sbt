enablePlugins(ScalaJSPlugin)

name := "FightHealthInsuranceFrontend"
scalaVersion := "2.13.10"

// This is an application with a main method
scalaJSUseMainModuleInitializer := true

libraryDependencies += "org.scala-js" %%% "scalajs-dom" % "2.1.0"


// Add support for the DOM in `run` and `test`
jsEnv := new org.scalajs.jsenv.jsdomnodejs.JSDOMNodeJSEnv()

enablePlugins(ScalaJSBundlerPlugin)

npmDependencies in Compile += "pdf.js" -> "0.1.0"
npmDependencies in Compile += "tesseract.js" -> "4.0.2"
npmDependencies in Compile += "tensorflow.js" -> "0.0.0"

scalaJSUseMainModuleInitializer := true

// uTest settings
libraryDependencies += "com.lihaoyi" %%% "utest" % "0.8.1" % "test"
testFrameworks += new TestFramework("utest.runner.Framework")
