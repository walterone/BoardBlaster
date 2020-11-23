# BoardBlaster

> This is a concept in Early Development, all feedbacks are appreciated!

BoardBlaster is a lightweight utility, made in Node.JS, for all your media downloading and curating needs! \
This tool crawls and downloads media files from your favourite 4Chan board. BoardBlaster also gives you a mobile-friendly visualizer page with different management options.

It uses a fast downloading algorythm and a friendly web interface to allow you full control of your medias, there's also a blacklisting and filtering feature included.

#### Right now this project it's in the early stage of testing, feel free to try it and report any kind of bug or issue you might encounter.







![](header.png)

## Installation

(Tested on Node.JS v12.16.2 or higher)

Once you have a functioning NodeJS enviroment, open a terminal/CMD in the project folder and run:

```sh
npm install
```

After the initial setup you can execute the web server by using:

```sh
node index.js
```

At this point you should see a message that specifies the http web-panel port. (Usually 3000):

```sh
[LOGGING]: server created on *:3000
```

Connect with your favourite browser to:
```sh
localhost:port (localhost:3000)
```



## More Details

The BoardBlaster project was born from the desire of downloading and keeping offline many different medias found on 4Chan's boards (especially the NSFW boards). From this idea i started making a simple crawler (Called 4ChanCrawler) that soon evolved in something much more interesting.

The program can be divided in 3 different "modules":

1. BB Core -> (The backend, responsable for doing the majority of the work)
2. Web Dashboard -> (Web control panel, UI and interfacing).

3. Viewer -> This the personal media gallery, it's optimized for mobile and allows to delete folders and files. Each folder deleted is than automatically added to that board's filter.


The working logic of BoardBlaster (BB) is the following:

1. Start by connecting to the Web-Dashboard and choosing the desired board to scan.
2. BB will list all the different threads (that contain any media) in the first two pages of the board. Each thread can be processed in three ways: 
    * **Ignore:** Just ignores it
    * **Download:** It will add all the medias in that thread to a queue. That queue will then be processed (and downloaded) in the next step 
    * **Blacklist:** It adds the thread name to the specific filter of that board so that in the future won't be showed anymore.
3. After having chosen an action for each thread, the BB core will start processing the medias with the chosen action. In this stage it's possible to skip the download if you changed your mind.
4. After having done it will restart from the second stage until it runs out of threads.

    Meanwhile all of this happens it's still possible to use the Visualizer Module with all its functions.






## Known Issues & TODO
#### Issues:
* In some boards (especially /a/) BB will sometimes serve the same threads again. This will result in errors when downlaoding the thumbnails
* Random rare issues when writing to the filter
* The logging system needs to be improved, still confusing
* Some thread names have a combination of weird characters that rarely cause the program to crash.

#### Things To Do:
* WebM management on mobile
* Tidy up code and logic
* Better logging & diagnostic system
* Rebuild
* Bug fixing (more and more)
* Split into standalone modules
* ~~Add Viewer module with all it's feature~~ (V0.6)
* ~~Dynamic filter path change~~ (V0.6)
* ~~Add a web console for real-time monitoring~~ (V0.7)
* ~~Add progress bar and better UI for improved UX~~ (V0.75)
* ~~Make the program stable enough so that it doesn't need to be restarted when switching between boards~~ (V0.8)
* ~~Initial setup needs to happen when the program starts and not when it starts to scan~~ (V0.8)
* ~~Ability to skip current download~~ (V0.8)







## Release History

* 0.8
    + ADD: Added idle stage, it's not necessary anymore to restart the program in order to switch board
    + ADD: Added better Web console UI.
    + ADD: Added a "Skip current download" button
    + FIX: Fixes:
        * Fixed an issue in the filter creation where the function wouldn't double check for the file existance.
        * Fixed a small issue in the `filedownload()` function that occasionally gave 404 errors.

* 0.7.5
    + ADD: Added boards description
    + ADD: Added different color for threads that are already downloaded
    + FIX: Major fixes:
        * Fixed filter loading after each blacklisting
        * Logging system now is tied to the web console
        * Download queue now clears after downloading
        * The `scan()` function now skips threads based on the chosen board

* 0.7.0
    + ADD: Added progress bar to dashboard
    + ADD: Enabled web console
    + CHANGE: The web console in now tied to the logging system
    + CLEANUP: General Optimization
    + FIX:  Major Fixes
* 0.6.5
    * FIX: Fixed thumbnail download
    * FIX: Minor fixes to web dashboard
    * CLEANUP: Cleaned main code
* 0.6.0
    * ADD: Added "Delete" button in Viewer.
    * ADD: Added Dynamic Filterpath for deleting files dynamically
    * FIX: Fixed Double Blacklisting for some images
* 0.5.0
    * The first proper release
    * ADD: Added "Viewer" module
* < 0.5.0
    * Work in progress (4ChanCrawler)

## Contacts

I will soon add more contacts and more details on this documents, for now if you need to contact me you can write me on GitHub

## Thanks

:)

