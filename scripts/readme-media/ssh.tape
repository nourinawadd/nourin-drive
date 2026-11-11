# docs/media/ssh.gif: the terminal version, recorded with VHS
# (https://github.com/charmbracelet/vhs) by shots/ssh.mjs, which adds the
# Output line and skips the shot when vhs isn't installed.
#
# This one talks to the live server, so it can't come out the same twice and
# `--check` leaves it out. Nothing private goes in here: the public address
# and keystrokes only. The first connection asks to trust the host key; say
# yes once in a normal terminal before recording, or the GIF shows the prompt.
#
# The keys below are a first guess at "look around a couple of screens";
# watch the result and tune the moves and sleeps.

Set FontSize 18
Set Width 1200
Set Height 720
Set Padding 24
Set Framerate 12
Set TypingSpeed 70ms

Type "ssh nourin.is-a.dev -p 2323"
Sleep 500ms
Enter
Sleep 4s

Down
Sleep 700ms
Down
Sleep 700ms
Enter
Sleep 3s

Escape
Sleep 1s
Down
Sleep 700ms
Enter
Sleep 3s

Escape
Sleep 800ms
Type "q"
Sleep 1.5s
