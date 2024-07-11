export const getSlug = (slug: string) => {
    return slug
        .split(" ")
        .join("-")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, "-");
};
