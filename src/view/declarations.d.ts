declare module "*.md" {
    const content: string;
    export default content;
}
declare module "*.gif" {
    const value: { default: string };
    export default value;
}

declare module "*.jpg" {
    const value: { default: string };
    export default value;
}