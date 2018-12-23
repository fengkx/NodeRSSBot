module.exports = async (ctx, next) => {
    console.log(ctx.message);
    const fileId = ctx.message.document.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    if(!!fileLink) {
        ctx.state.fileLink = fileLink;
        await next();
    };
};
