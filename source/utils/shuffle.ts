export default function arrayShuffle(array) {
    if (!Array.isArray(array)) {
        throw new TypeError(`Expected an array, got ${typeof array}`);
    }

    if (array.length === 0) {
        return [];
    }

    for (let index = array.length - 1; index > 0; index--) {
        const newIndex = Math.floor(Math.random() * (index + 1));
        [array[index], array[newIndex]] = [array[newIndex], array[index]];
    }

    return array;
}
