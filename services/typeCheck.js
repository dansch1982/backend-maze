function typeCheck(received, ...expected) {
    if (getType(received) === "arguments") { received = Object.values(received) }
    else { received = [received] }
    expected.forEach((item, index) => {
        convertType(received[index], index, received)
        if (Array.isArray(item) && item.length) { item.forEach(convertType) }
        else { expected[index] = getType(item) }
    })
    if(!expected.every((item, index) => { return (Array.isArray(item) && item.includes(received[index]) || item === received[index]) })) {
        expected.forEach(items => { this.expectedString += (Array.isArray(items) && items.length > 1 ? `[${items.join("|")}]` : items) + ", " })
        throw new TypeError(`Expected ${this.expectedString.slice(getType(undefined).length, -2)}. Received ${received.join(', ')}.`)
    } 
    function convertType(item, index, array) { array[index] = getType(item) }
    function getType(obj) { return Object.prototype.toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase() }
}
module.exports = typeCheck