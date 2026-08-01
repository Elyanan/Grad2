REDIATE'S GRADUATION CEREMONY — HTML/CSS/JAVASCRIPT VERSION
============================================================

HOW TO OPEN IT
--------------
1. Extract the ZIP folder completely.
2. Open the extracted folder.
3. Double-click index.html.

There is no npm install, terminal command, build process, React, Next.js, or local server.
Keep index.html, styles.css, data.js, script.js, and the media folder together.

FILES
-----
index.html    Main website file. Double-click this file.
styles.css   The complete visual design and responsive styles.
data.js      All editable names, speech, letter, wishes, timeline and media paths.
script.js    Animations, audio, gallery, stars, diploma, navigation and other interactions.
media/       Replaceable image and audio files.

REPLACING IMAGES
----------------
The current image placeholders are inside:

media/images/

You can either:
- Replace the existing files while keeping the same names, or
- Put JPG/PNG/WebP files in the folder and update their paths in data.js.

Examples:
portrait: "media/images/her-graduation-photo.jpg"
src: "media/images/memory-1.jpg"

REPLACING AUDIO
---------------
Put the sounds inside:

media/audio/

Expected names:
background-music.mp3
applause.mp3
celebration.mp3
speech.mp3
envelope.mp3

The included MP3 files are silent placeholders. Replace them with your real audio.
Audio only begins after the visitor presses "Begin the Ceremony."

EDITING TEXT
------------
Open data.js using Notepad, Visual Studio Code, or another text editor.
That file contains:
- Rediate Markos
- Elyanan Wondwossen
- Graduation year and date
- Four speech chapters
- The future letter
- Timeline milestones
- Achievement messages
- Gallery captions
- Star wishes
- Promise and final messages

Do not remove commas, quotation marks, brackets, or braces unless you understand JavaScript syntax.

INTERNET CONNECTION
-------------------
The website itself and all personal media are local. Google Fonts, Lucide icons and the optional GSAP stage animation are loaded through CDNs. The main content and interactions still use local HTML, CSS and JavaScript.

MOBILE
------
The layout is responsive for phones, tablets and desktop screens. Extract the full folder before opening index.html so the images, audio, CSS and JavaScript remain connected.
