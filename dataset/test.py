# -*- coding:utf-8 -*-
import random
import base64
import os
import sys

def genRandomBytes(num):
    return ''.join([chr(random.randint(32, 126)) for _ in range(0, num)])

def createOriginalData():
    with open("1K.txt", "w") as f:
        f.write(genRandomBytes(1024))

    with open("10K.txt", "w") as f:
        f.write(genRandomBytes(10 * 1024))

    with open("100K.txt", "w") as f:
        f.write(genRandomBytes(100 * 1024))

    with open("1M.txt", "w") as f:
        f.write(genRandomBytes(1024 * 1024))

    with open("10M.txt", "w") as f:
        f.write(genRandomBytes(10 * 1024 * 1024))

    with open("100M.txt", "w") as f:
        f.write(genRandomBytes(100 * 1024 * 1024))

    # with open("1G.txt", "w") as f:
    #     f.write(genRandomBytes(1024 * 1024 * 1024))


def append():
	appBytes = []
	appSizes = [1, 10, 100, 1024, 10 * 1024, 100 * 1024, 1024 ** 2, 10 * 1024 ** 2, 100 * 1024 ** 2]
	dirNames = ['1B', '10B', '100B', '1KB', '10KB', '100KB', '1MB', '10MB', '100MB']

	for size in appSizes:
		appBytes.append(genRandomBytes(size))

	filelist = readFileName('.')
	for file in filelist:
		with open(file, 'r') as f:
			content = f.read()
			for i, dir in enumerate(dirNames):
				print(i)
				newContent = content + appBytes[i]
				if not os.path.exists('./append/{:}'.format(dir)):
					os.makedirs('./append/{:}'.format(dir))
				with open('./append/{:}/{:}'.format(dir, file), 'w') as f:
					f.write(newContent)
	

def insertBytes(content, bytes, blocks):
    bytesPerBlock = int(len(bytes) / blocks)
    positions = [random.randint(0, len(bytes)) for _ in range(blocks)]
    positions.sort()

    res = content[:positions[0]]
    for i in range(blocks):
        last = i == blocks - 1
        start = i * bytesPerBlock
        end = len(bytes) if last else start + bytesPerBlock
        res += bytes[start : end] + (
            content[positions[i]:] if last else content[positions[i] : positions[i + 1]]
        )
    return res


def insert():
    genBytes = []
    genSizes = [1, 10, 100, 1024, 10 * 1024, 100 * 1024, 1024 ** 2, 10 * 1024 ** 2, 100 * 1024 ** 2]
    dirNames = ['1B', '10B', '100B', '1KB', '10KB', '100KB', '1MB', '10MB', '100MB']
    blocks = [1, 1, 1, 1, 1, 1, 3, 30, 300]

    for size in genSizes:
        genBytes.append(genRandomBytes(size))
    filelist = readFileName('.')
    for file in filelist:
        with open(file, 'r') as f:
            content = f.read()
            for i, dir in enumerate(dirNames):
                newContent = insertBytes(content, genBytes[i], blocks[i])
                if not os.path.exists('./insert/{:}'.format(dir)):
                	os.makedirs('./insert/{:}'.format(dir))
                with open('./insert/{:}/{:}'.format(dir, file), 'w') as f:
                    f.write(newContent)

def deleteBytes(content, delSize, blocks):
    bytesPerBlock = int(delSize / blocks)

    res = content
    for i in range(blocks):
        size = bytesPerBlock if i != blocks - 1 else delSize - bytesPerBlock * (blocks - 1)
        pos = random.randint(0, len(res) - size)
        res = res[:pos] + res[pos + size:]
    return res

def cut():
    delSizes = [1, 10, 100, 1024, 10 * 1024, 100 * 1024, 1024 ** 2, 10 * 1024 ** 2, 100 * 1024 ** 2]
    dirNames = ['1B', '10B', '100B', '1KB', '10KB', '100KB', '1MB', '10MB', '100MB']
    blocks = [1, 1, 1, 1, 1, 1, 3, 30, 300]

    filelist = readFileName('.')
    for file in filelist:
        with open(file, 'r') as f:
            content = f.read()
            length = len(content)
            for i, dir in enumerate(dirNames):
                if length < delSizes[i]:
                    break
                newContent = deleteBytes(content, delSizes[i], blocks[i])
                if not os.path.exists('./cut/{:}'.format(dir)):
                	os.makedirs('./cut/{:}'.format(dir))
                with open('./cut/{:}/{:}'.format(dir, file), 'w') as f:
                    f.write(newContent)

def readFileName(curdir):
    return [f for f in os.listdir(curdir) if os.path.splitext(f)[1] == '.txt']

def main():
    if len(sys.argv) < 2:
        return
    if sys.argv[1] == "append":
        append()
    if sys.argv[1] == "insert":
        insert()
    if sys.argv[1] == "cut":
        cut()

if __name__ == "__main__":
    # createOriginalData()
    main()
