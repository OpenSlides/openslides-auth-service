export type Id = number;
export type Fqid = `${string}/${number}`;

export const getIdFromFqid = (fqid: Fqid): Id => {
    const splits = fqid.split('/');
    if (splits.length !== 2) {
        throw new Error('Wrong fqid!');
    }
    const id = parseInt(splits[1], 10);
    return id;
};
