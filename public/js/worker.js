const MODADLER = 65521;
const siphash = new function() {
    "use strict";
    function _add(a, b) {
        var rl = a.l + b.l,
            a2 = { h: a.h + b.h + (rl / 2 >>> 31) >>> 0,
                l: rl >>> 0 };
        a.h = a2.h; a.l = a2.l;
    }

    function _xor(a, b) {
        a.h ^= b.h; a.h >>>= 0;
        a.l ^= b.l; a.l >>>= 0;
    }

    function _rotl(a, n) {
        var a2 = {
            h: a.h << n | a.l >>> (32 - n),
            l: a.l << n | a.h >>> (32 - n)
        };
        a.h = a2.h; a.l = a2.l;
    }

    function _rotl32(a) {
        var al = a.l;
        a.l = a.h; a.h = al;
    }

    function _compress(v0, v1, v2, v3) {
        _add(v0, v1);
        _add(v2, v3);
        _rotl(v1, 13);
        _rotl(v3, 16);
        _xor(v1, v0);
        _xor(v3, v2);
        _rotl32(v0);
        _add(v2, v1);
        _add(v0, v3);
        _rotl(v1, 17);
        _rotl(v3, 21);
        _xor(v1, v2);
        _xor(v3, v0);
        _rotl32(v2);
    }

    function _get_int(a, offset) {
        return a[offset + 3] << 24 |
            a[offset + 2] << 16 |
            a[offset + 1] << 8 |
            a[offset];
    }

    function hash(m) {
        var key = [ 0xdeadbeef, 0xcafebabe, 0x8badf00d, 0x1badb002 ]
        var k0 = { h: key[1] >>> 0, l: key[0] >>> 0 },
            k1 = { h: key[3] >>> 0, l: key[2] >>> 0 },
            v0 = { h: k0.h, l: k0.l }, v2 = k0,
            v1 = { h: k1.h, l: k1.l }, v3 = k1,
            mi, mp = 0, ml = m.length, ml7 = ml - 7,
            buf = new Uint8Array(new ArrayBuffer(8));

        _xor(v0, { h: 0x736f6d65, l: 0x70736575 });
        _xor(v1, { h: 0x646f7261, l: 0x6e646f83 });
        _xor(v2, { h: 0x6c796765, l: 0x6e657261 });
        _xor(v3, { h: 0x74656462, l: 0x79746573 });
        while (mp < ml7) {
            mi = { h: _get_int(m, mp + 4), l: _get_int(m, mp) };
            _xor(v3, mi);
            _compress(v0, v1, v2, v3);
            _compress(v0, v1, v2, v3);
            _xor(v0, mi);
            mp += 8;
        }
        buf[7] = ml;
        var ic = 0;
        while (mp < ml) {
            buf[ic++] = m[mp++];
        }
        while (ic < 7) {
            buf[ic++] = 0;
        }
        mi = { h: buf[7] << 24 | buf[6] << 16 | buf[5] << 8 | buf[4],
            l: buf[3] << 24 | buf[2] << 16 | buf[1] << 8 | buf[0] };
        _xor(v3, mi);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        _xor(v0, mi);
        _xor(v2, { h: 0, l: 0xee });
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);

        var hh = { h: v0.h , l: v0.l };
        _xor(hh, v1);
        _xor(hh, v2);
        _xor(hh, v3);
        _xor(v1, { h: 0, l: 0xdd });
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        _compress(v0, v1, v2, v3);
        var hl = v0;
        _xor(hl, v1);
        _xor(hl, v2);
        _xor(hl, v3);

        return [hl.h, hl.l, hh.h, hh.l];
    }

    function string16_to_key(a) {
        return [_get_int(a, 0), _get_int(a, 4),
            _get_int(a, 8), _get_int(a, 12)];
    }
    function hash_uint(key, m) {
        var r = hash(key, m);
        return (r.h & 0x1fffff) * 0x100000000 + r.l;
    }

    this.lib = {
        string16_to_key: string16_to_key,
        hash: hash,
        hash_uint: hash_uint
    };
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
            adlerInfo = rollingChecksum(start, end - 1, dataView)
        } else {
            adlerInfo = adler32(start, end - 1, dataView);
        }
        bufferView[offset++] = adlerInfo;

        // calculate the full SipHash checksum
        const sipHashSum = siphash.lib.hash(dataView, 0, start, chunkLength);
        for (let j = 0; j < 4; j++) {
            bufferView[offset++] = sipHashSum[j];
        }
    }
}

self.onmessage = work;
