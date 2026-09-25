function getFileExtensionFromUrl(url) {
    // Get the path part of the URL
    const path = new URL(url).pathname;

    // Use regex to extract the file extension
    const match = /\.\w+$/i.exec(path);

    // Check if a match is found and return the extension (excluding the dot)
    return match ? match[0].slice(1) : null;
}