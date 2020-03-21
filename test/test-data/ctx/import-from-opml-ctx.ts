export default {
    state: {
        lang: 'en',
        fileLink: '',
        chat: {
            id: 233233233,
            first_name: 'Test_First_Name',
            last_name: 'Test_Last_Name',
            username: 'test',
            type: 'private'
        }
    },
    telegram: {
        deleteMessage: jest.fn()
    },
    replyWithHTML: jest.fn()
};
