// Progress OpenEdge specific utils

/**
 * Returns the length of an OE format
 * https://chat.openai.com/share/c045c5bb-050e-40e0-b1cf-148cc1324dfd
 * @param {string} formatStr OE format string. See https://docs.progress.com/bundle/openedge-abl-essentials-117/page/Defining-formats.html
 * @return {number} length of format
 */
export const getOEFormatLength = (formatStr: string): number => {
    let length = 0;

    for (
        let lengthIterator = 0;
        lengthIterator < formatStr.length;
        lengthIterator++
    ) {
        const char = formatStr[lengthIterator];

        switch (char) {
            case '(':
                // Handle the (n) format
                ({ length, lengthIterator } = handleParentheses(
                    formatStr,
                    length,
                    lengthIterator
                ));
                break;
            case ',':
            case '.':
                // do nothing
                break;
            default:
                length++;
                break;
        }
    }

    if (length > 100) {
        length = 100;
    } else if (length <= 0) {
        length = 6;
    }

    return length;
};

function handleParentheses(
    formatString: string,
    length: number,
    lengthIterator: number
) {
    const closingParenIndex = formatString.indexOf(')', lengthIterator + 1);
    if (closingParenIndex !== -1) {
        const repeatCount = parseInt(
            formatString.slice(lengthIterator + 1, closingParenIndex),
            10
        );
        length += Math.max(repeatCount - 1, 0); // Ensure repeatCount is non-negative
        lengthIterator = closingParenIndex; // Skip the characters inside the parentheses
    }
    return { length, lengthIterator };
}
