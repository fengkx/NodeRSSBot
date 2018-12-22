const pm = {};

pm.isAdmin = async (ctx, next) => {
    ctx.state.chat =  await ctx.getChat();
    const chat = ctx.state.chat;
    // console.log(chat);
    if(chat.type !== 'private') {
        switch (chat.type) {
            case 'group':
            case 'supergroup':
            case 'channel':
                const admins = await ctx.getChatAdministrators(chat.id);
                const isAdmin = admins.some(function (item) {
                    return item.user.id === ctx.message.from.id;
                });
                if(!isAdmin)
                    throw new Error('ADMIN_ONLY');
        }
    }
    await next();
};

module.exports = pm;
