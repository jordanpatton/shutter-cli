import {
    downloadPhotosFromShutterfly,
    parseDownloadPhotosFromShutterflyParameters,
} from './workflows/downloadPhotosFromShutterfly/index.js';

downloadPhotosFromShutterfly(parseDownloadPhotosFromShutterflyParameters());
