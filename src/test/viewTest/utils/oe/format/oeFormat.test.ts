import { expect } from "@jest/globals";
import { getOEFormatLength } from "../../../../../view/app/utils/oe/format/oeFormat";

describe("getOEFormatLength", () => {
    it('should return the correct length for "xxx"', () => {
        expect(getOEFormatLength("xxx")).toBe(3);
    });

    it('should return the correct length for "x(40)"', () => {
        expect(getOEFormatLength("x(40)")).toBe(40);
    });

    it('should return the correct length for "$>>.>>>"', () => {
        expect(getOEFormatLength("$>>.>>>")).toBe(6);
    });

    it('should return the correct length for "99.>>>"', () => {
        expect(getOEFormatLength("99.>>>")).toBe(5);
    });

    it('should return the correct length for "9(7)"', () => {
        expect(getOEFormatLength("9(7)")).toBe(7);
    });

    it('should return the correct length for "99"', () => {
        expect(getOEFormatLength("99")).toBe(2);
    });

    it('should return the correct length for "ABBBBEEEE"', () => {
        expect(getOEFormatLength("ABBBBEEEE")).toBe(9);
    });

    it('should return the correct length for "99KKTB"', () => {
        expect(getOEFormatLength("99KKTB")).toBe(6);
    });

    it('should return the correct length for "zzz,zzz,zz"', () => {
        expect(getOEFormatLength("zzz,zzz,zz")).toBe(8);
    });

    it('should return the correct length for "z"', () => {
        expect(getOEFormatLength("z")).toBe(1);
    });

    it('should return the correct length for ""', () => {
        expect(getOEFormatLength("")).toBe(6);
    });

    it("should return 100 if the calculated length is greater than 100", () => {
        const longFormat = "X".repeat(200);
        expect(getOEFormatLength(longFormat)).toBe(100);
    });

    it("should return 6 if the calculated length is less than or equal to 0", () => {
        expect(getOEFormatLength("")).toBe(6);
    });
});
