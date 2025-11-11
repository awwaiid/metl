# metl
Model Extract Transform Load -- Logic Code Analysis and Generation

The idea here is to use tools like [Alloy](https://alloytools.org/) and [TLA+](https://lamport.azurewebsites.net/tla/tla.html) in real-code situations powered by LLM technology (Agents if you will). The initial and flagship usecase:

* Extract a high-level model (Alloy/TLA+) from your codebase
* Use that model to explore and visualize data and interaction scenarios
* Identify interesting cases, especially failures
* Translate those cases back into (failing) tests written in the codebase language

From there you can, of course, fix the implementation and/or the concepts of your code.

## General process

* Identify a small number (3-4) of core concepts (models and/or interactions) from the codebase
* Build an Alloy or TLA+ version of the model
* Loop: Generate an example, translate it into a test in the original system, execute it there to confirm
* If we find an example that we expect to fail but it works in the original system, there is likely a software constraint that we can identify and then add that into the model
* If we find an example that fails in the original system and highlights a flaw, great!
* The result should be (all in a dedicated folder):
  * A markdown document describing the model and including some diagrams
  * A model file(s) in Alloy or TLA+
  * Some passing or failing tests in the original system
  * A shell script to run the models
  * A shell script to run the generated original system tests
 
## Tools

This tool is implemented in JS and [Claude Agent SDK](https://docs.claude.com/en/docs/agent-sdk/overview).

Initially we will only implement Alloy models. Use [alloy-lang](https://www.npmjs.com/package/alloy-lang) npm module.

We can use public projects like [Human Essentials](https://github.com/rubyforgood/human-essentials) to try this on a real application.
