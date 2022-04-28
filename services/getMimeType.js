function getMimeType(ext) {
	const types = {
		"application/json": [".json"],
		"text/html": [".htm", ".html"],
		"text/css": [".css"],
		"text/plain": ".txt",
		"image/jpeg": [".jpeg", ".jpg"],
		"image/png": [".png"],
		"image/svg+xml": [".svg"],
		"image/gif": [".gif"],
		"image/vnd.microsoft.icon": [".ico"],
		"text/javascript": [".js"],
	};
	const mimeTypes = {};
	for (const key in types) {
		const elements = types[key];
		if (Array.isArray(elements)) {
			elements.forEach((element) => {
				mimeTypes[element] = key;
			});
		} else {
			mimeTypes[elements] = key;
		}
	}
	return mimeTypes[ext] || "application/octet-stream";
}

module.exports = getMimeType