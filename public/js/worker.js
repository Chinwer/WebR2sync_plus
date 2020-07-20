const MODADLER = 65521;
const siphash = function(message, seed, offset, chunksize) {
    const m = message.slice(offset, offset + chunksize);
    importScripts("siphash.js")
    return SipHash.lib.hash(m)
}

function rollingChecksum(adlerInfo, offset, end, data) {
    newdata = 0;
    if (end < data.length) {
        newdata = data[end];
    } else {
        end = data.length-1;
    }
    let tmp = data[offset - 1]; //this is the first byte used in the previous iteration
    let a = ((adlerInfo.a - tmp + newdata) % MODADLER + MODADLER) % MODADLER;
    let b = ((adlerInfo.b - ((end - offset + 1) * tmp) + a - 1) % MODADLER + MODADLER) % MODADLER;
    return ((b << 16) | a) >>> 0;
}

function adler32(offset, end, data) {
    let a = 1, b= 0;

    //adjust the end to make sure we don't exceed the extents of the data.
    if (end >= data.length) {
        end = data.length - 1;
    }

    for (let i = offset; i <= end; i++) {
        a += data[i];
        b += a;
        a %= MODADLER;
        b %= MODADLER;
    }

    return ((b << 16) | a) >>> 0;
}

// function work(startBlock, endBlock, dataView, bufferView, blockSize, byteLength) {
function work(message) {
    console.log("----------------------")
    console.log("Hello from worker thread!")
    console.log("----------------------")
    const data = message.data;
    const startBlock = data.startBlock;
    const endBlock = data.endBlock;
    const dataView = data.dataView;
    const doc = data.doc;
    const blockSize = data.blockSize;
    const byteLength = data.byteLength;

    let adlerInfo = null;
    let offset = 3 + 5 * startBlock;
    let bufferView = new Uint32Array(doc);
    for (let i = startBlock; i <= endBlock; i++) {
        let start = i * blockSize;
        let end = start + blockSize;
        let chunkLength = blockSize;

        if (start + blockSize > byteLength) {
            adlerInfo = null;
            chunkLength = byteLength - start;
        }

        // calculate the adler32 checksum
        if (adlerInfo) {
            adlerInfo = rollingChecksum(start, end - 1, dataView, adlerInfo)
        } else {
            adlerInfo = adler32(start, end - 1, dataView);
        }
        bufferView[offset++] = adlerInfo;

        // calculate the full SipHash checksum
        const sipHashSum = siphash(dataView, 0, start, chunkLength);
        for (let j = 0; j < 4; j++) {
            bufferView[offset++] = sipHashSum[j];
        }
    }
}

self.onmessage = work;
