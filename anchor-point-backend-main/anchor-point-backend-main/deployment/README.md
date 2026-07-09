## Local docker file

    1. To run the app locally with volumes exposed and setting app mode to debug.
## Prod docker file

    1. To run the app at production level, here all sorts of debugging facilities are not present.
## Entry point file

    1. The entry file consists of two startup tasks, one is to make revision for exsisting table schemas available in models file and upgrade to it.

    2. After DB migrations, the command to start the app is executed.