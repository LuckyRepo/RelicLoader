# DeezLoader For Android 

# Version 2.1.8 (Latest version)
##### Minimum Android version: Android 5.0 (Lollipop)
##### Versión mínima de Android: Android 5.0 (Lollipop)

### [Download DeezLoader-2.1.8-universal-debug.apk](https://gitlab.com/Nick80835/DeezLoader-Android/raw/master/Release/DeezLoader-2.1.8-universal-debug.apk)

# Changelog
- 2.1.8
	- Fixed title on small screens.

- 2.1.7
	- Fixes for smaller device screens.

- 2.1.6
    - Slight UI overhaul, misc fixes.

- 2.1.5
    - Fixed genre language.
    - Tab bar tweaks.

- 2.1.4
    - A lot of miscellaneous bux fixes and corrections.
    - Bring up things I forgot to include in 2.1.3.
    - Oh, more bug fixes.

- 2.1.3
    - Added the option to select between 128kbps, 320kbps or 1411kbps.
    - Added a bottom tab navigation bar with icons to replace the scrolling tabs at the top.
    - More of those bug fixes.

- 2.1.2
    - More bug fixes.
    - Improved downloads tab spacing.

- 2.1.1
    - Fixed login bugs.
    - Minor UI tweaks and fixes.

- 2.1.0 (test build)
    - Bug fixes and improved performance.

- 2.0.9
    - Rolled back to deezloader 4.0.2 (is by far more stable, but i'll update again to the beauty of 4.1.x someday...)
    - Added back the webview in-app

- 2.0.8
    - (Main app, thanks @Tognee) Fixed the login error
    - Fixed a bug where the settings of the user were not shown when the settings icon was clicked (only on small screens and also only on mobile web browsers)
    - Added the "coma with space" separator for the tags
    - Dissabled webView in app (now it should be used in browser as it was planned)
    - Added link to the telegram group
    - Added message when an update is available

- 2.0.7
    - Updated to the correct Deezloader 4.0.1
    - Reenabled progress notification on single downloads

- 2.0.6
    - Updated to deezloader 4.1.0

- 2.0.5
    - Updated to deezloader 4.0.3 with parallel downloads
    - Removed progress download due to Parallel downloads
    - Fixed login (at the main app, thanks to the main dev) at the most cases 

- 2.0.4
    - Fixed error when app internally crashed on login
    - Signup button at login now works propelly
    - Improved the way the app starts the server (so it should start in most of the cases)

- 2.0.2
    - Fixed a bug when a song has been downloaded but the notification doesn't  dissapear

- 2.0.1
    - Fixed a bug when the app sometimes crashed after a song has been downloaded

- 2.0
    - Updated to Deezloader Remix 4.0.2
    - Dissabled "save to external memory" for practical reasons
    - Login should be fixed in at least most of the cases

- 1.1.9 (I've created a monster)
    - Added persistance so the app has less probabilities of being closed on middle of a download (it doesn't mean that it cannot happen)
    - Added a huge use of memory (your phone may slow down, but hey, persistance is not free)
    - Added an exit button in the settings page to fully close the app (if the app hasn't been ended yet)
    - Optimized downloads notification (Doesn't matter you download a song, an album or a playlist, a notification with the actual song downloading and it's respective progress)
    - Optimized "Getting track data" notification
    - Updated server prepairing method (now is more probable to work, but doesn't mean it would work on all the cases)
    
- 1.1.8
    - Fixed a bug where the app randomly crashed when a song has been downloaded

- 1.1.7
    - For better experience, if the download folder is diferent to the default, the "create album/artist folder" are disabled (the songs doesn't download if at least one of those options are selected). Thanks to Milo Joseph for help finding this bug :D
    - Charts tab redesigned
    - Start loading screen improved for better understanding of what is being done while the app starts
    - Updated method to make android recognize new songs downloaded to the external storage properly

- 1.1.6
    - Replaced the webview with a better implementation of itself which is more stable at the time of showing the page
    - Fixed a bug that crashed the app if the progress of a download wasn't valid

- 1.1.5
    - Added option to select another download path (in fact, it still downloads it to the default storage but if another folder has been selected, the app will automaticaly move the file to the selected folder when the download has been completed)

- 1.1.4
    - Added notification on download canceled
    - Added notification when a song is already downloaded

- 1.1.3
    - UI Improvements
    - The temp image of the cover now is deleted after the download
    - When a new version of DeezLoader for android is available a popup will appear on start

- 1.1.2
    - Now there are apk variants in case the general one fails

- 1.1.1
    -  Now the songs are reflected on MediaStore after being downloaded
    -  A notification is displayed when a song is being downloaded