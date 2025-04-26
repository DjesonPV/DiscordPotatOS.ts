/*
 * Copyright 2018 TheAkio <me@theak.io>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import internal, { PassThrough, Readable } from 'stream';
import { URL } from 'url';
import BufferedStreamLoader from './BufferedStreamLoader.js';
import M3U8Parser from './M3U8Parser.js';
import EventEmitter from 'events';

/**
 * Utility class that turns a YouTube Livestream M3U8 playlist URL into a stream containing all segments
 */
class YouTubeLiveStream extends PassThrough {
	private resolveFunc: (firstResolve: boolean) => string|Promise<string>;
	private segmentCacheCount: number;

	private resolvedUrl?: string;
	private urlExpire: number = 0;
	private startSequence?: string;
    private startFromBegining: boolean;

	private loadInterval: NodeJS.Timer | undefined;
	private isLoadingSegments: boolean = false;

	/**
	 * Creates a new YouTubeLiveStream and starts it
	 *
	 * @event error Emitted when an error occurrs on the stream. The stream will end after this.
	 * @event warning Emitted when a warning occurrs on the stream. The stream will continute normally.
	 * @param resolveFunc A function that resolves to a YouTube M3U8 playlist URL (Use YTDL or youtube-dl to get the URL)
	 * @param segmentCacheCount How many segments should be buffered. Minimum is 3. The more data is cached the more the stream is delayed
     * @param startFromBegining Choose if you start reading the stream from the begining or the end.
	 */
	constructor(resolveFunc: (firstResolve: boolean) => string|Promise<string>, segmentCacheCount: number = 3, startFromBegining: boolean = false) {
		super();

        EventEmitter.setMaxListeners(0);
		this.resolveFunc = resolveFunc;

		if (isNaN(segmentCacheCount)) throw new Error('YTLS: Segment cache count is NaN');
		if (segmentCacheCount < 3) throw new Error('YTLS: Segment cache count cannot be < 3');
		this.segmentCacheCount = segmentCacheCount;

		super.on('close', () => {clearLoadInterval();});

        const clearLoadInterval = () => {
            if (this.loadInterval) {
				clearInterval(this.loadInterval);
			}
        };

        this.startFromBegining = startFromBegining;

		// Define error wrapper function so we clear interval and close the stream before passing to the user
		const errorFn = (e: Error) => {
			this.destroy();
			this.emit('error', e);
		};

		// Define load function for interval and direct call
		const loadFn = async () => {
			try {
				await this.loadSegments();
				this.emit('available');
			} catch (e:any) {
				errorFn(e);
			}
		};

		// Start loading segments, the stream will then start
		loadFn();
		// Try segment loading. The interval is calculated by how much data is cached
        this.loadInterval = setInterval(loadFn, ( Math.min(this.segmentCacheCount - 2, 1)) * 4500);
	}
    

	private getExpireTime(url: string) {
		const matches = /(?:expire\/([0-9]+))/g.exec(url);
		if (!matches) throw new Error('YTLS: A playlist URL had no expire time');
		return parseInt(matches[1], 10);
	}

	private getSequenceID(url: string) {
		// Search for a parameter called "sq" with a numeric value
		const matches = /(?:sq\/([0-9]+))/g.exec(url);
		// If nothing is found this is bad and the stream needs to end
		if (!matches) throw new Error('YTLS: A segment URL had no sequence ID');
		// Return the match if found
		return parseInt(matches[1], 10);
	}

	private async loadSegments() {
		// Prevent this function from getting stuck and getting called again by the interval
		if (this.isLoadingSegments) {
			this.emit('warning', 'A segment load was attempted while another one was still running. (This may indicate a slow internet connection)', null);
			return;
		}
		this.isLoadingSegments = true;

		// Check for resolved url
		if (!this.resolvedUrl || Date.now() > this.urlExpire) {
			this.resolvedUrl = await this.resolveFunc(!this.resolvedUrl);
			this.urlExpire = this.getExpireTime(this.resolvedUrl) * 1000;
		}

		// Create URL object and apply startSequence if we have one
		const url = new URL(this.resolvedUrl);
		if (this.startSequence) url.searchParams.append('start_seq', this.startSequence);

		// Download the M3U8 file
		const req = await BufferedStreamLoader.downloadTries(url.href, 3, (msg, e) => this.emit('warning', msg, e));

		// Parse M3U8
		const parser = req.pipe(new M3U8Parser() as any);

		// Get all items in an array
		let items: string[] = [];
		parser.on('item', (item: string) => {
			items.push(item);
		});

		// Wait until the parser finishes
		await new Promise((resolve, reject) => {
			req.on('error', reject);
			parser.on('end', resolve);
		});

		// Check if load interval is still running and we got some new items. Otherwise end execution and reset status
		if (this.loadInterval == null || items.length === 0) {
			this.isLoadingSegments = false;
			return;
		}

		if (this.startFromBegining)
        {
            items.slice(0,0);
            this.startSequence = `${this.getSequenceID(items[0])}`;
            this.startFromBegining = false;
        }
        // Only take the last X elements if no start sequence
        if (!this.startSequence) items = items.slice(-this.segmentCacheCount);

		// Go through each URL
		for (const item of items) {
			// Download segment data
			const segment = await BufferedStreamLoader.downloadTries(item, 3, (msg, e) => this.emit('warning', msg, e));

			// Check if the loading interval exists, aka the stream is still open
			if (this.loadInterval == null) {
				this.isLoadingSegments = false;
				return;
			}

			// Pipe through this stream
			segment.pipe(this as any, { end: false });
		}

		// Get the last item
		const lastItem = items[items.length - 1];
		// Set the sequenceId for the next request to the one of the last item + 1
		this.startSequence = `${this.getSequenceID(lastItem) + 1}`;

		// Reset loading status
		this.isLoadingSegments = false;
	}
}

declare interface YouTubeLiveStream {
}

export default YouTubeLiveStream;
