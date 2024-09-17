export const getSlug = (slug: string) => {
    return slug
        .split(" ")
        .join("-")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-]/g, "-");
};

export const getMonth = (month: number) => {
    let monthByName = ""
    switch(month) {
        case 1:
            monthByName = "Jan";
            break;
        case 2:
            monthByName = "Feb";
            break;
        case 3:
            monthByName = "Mar";
            break;
        case 4:
            monthByName = "Apr";
            break;
        case 5:
            monthByName = "May";
            break;
        case 6:
            monthByName = "Jun";
            break;
        case 7:
            monthByName = "Jul";
            break;
        case 8:
            monthByName = "Aug";
            break;
        case 9:
            monthByName = "Sep";
            break;
        case 10:
            monthByName = "Oct";
            break;
        case 11:
            monthByName = "Nov";
            break;
        case 12:
            monthByName = "Dec";
            break;
        default:
            break;
    }
    return monthByName
}
