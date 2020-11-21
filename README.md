# BoardBlaster

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
localhost:port
```



## More Details

The BoardBlaster project was born from the desire of downloading and keeping offline many different medias found on 4Chan's boards (especially the NSFW boards). From this idea i started making a simple crawler (Called 4ChanCrawler) that soon evolved in something much more interesting than just a simple downloader.

The working logic of BoardBlaster (BB) is the following:

1. It starts by letting the user chose the board that they want to scan
2. BB then serves the different threads of the board, each thread has three options: **Ignore, Download and Blacklist**
3. After having chosen an action for one (or more) specific thread, the BB core will start processing the medias. It will download or blacklist the media file.
4. Once done it will start crawling for more threads on that board.



## Release History

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

