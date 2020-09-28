interface CodepenFeedHead {
	title: string;
	description: string | null;
	pubDate: Date;
	link: string;
	language: string;
	copyright: string;
	generator: null;
	cloud: object;
	image: object;
	categories: unknown[];
}

interface CodepenFeedItemMeta {
	title: string;
	description: null;
	date: Date;
	pubDate: Date;
	link: string;
	xmlUrl: null;
	author: string;
	language: string;
	favicon: null;
	copyright: string;
	generator: null;
	cloud: object;
	image: object;
	categories: unknown[];
}

interface CodepenFeedItem {
	title: string;
	description: string;
	date: Date;
	pubDate: Date;
	link: string;
	guid: string;
	author: string;
	comments: null;
	origLink: null;
	image: object;
	source: object;
	categories: string[];
	enclosures: unknown[];
	permalink: string;
	meta: CodepenFeedItemMeta;
}

interface CodepenFeedData {
	head: CodepenFeedHead;
	items: CodepenFeedItem[];
}