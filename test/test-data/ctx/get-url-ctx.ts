export default (text) => ({
    state: {
        lang: 'en',
        chat: {
            id: 233233233,
            type: 'private'
        }
    }, // wait for data
    // eslint-disable-next-line no-empty-function
    reply: jest.fn(),
    message: {
        message_id: 14891,
        from: {
            id: 233233233,
            is_bot: false,
            first_name: 'Test_First_Name',
            last_name: 'Test_Last_Name',
            username: 'test',
            language_code: 'zh-hans'
        },
        chat: {
            id: 233233233,
            first_name: 'Test_First_Name',
            last_name: 'Test_Last_Name',
            username: 'test',
            type: 'private'
        },
        date: 1571720803,
        text
    }
});
