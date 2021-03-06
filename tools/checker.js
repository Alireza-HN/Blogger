const CHECKER = {
    duplicate_signup: duplicate_signup_validator,
    duplicate_edit: duplicate_edit_validator,
    duplicate_title: duplicate_title_validator,
    has_article,
    has_comment
};

//models
const User = require('../models/user.js');
const Article = require('../models/article.js');
const Comment = require('../models/comment.js');


//******************************************************************************** */
//              duplicate 'username' and 'mobile' check - Sign-up
//******************************************************************************** */

async function duplicate_signup_validator(username, mobile)
{
    // user existence check
    const blogger_username = await User.findOne({username}, (err) => {
        if (err) new Error(err);
    });

    if (blogger_username) {
        return (`${username} already exists.`);
    }


    //mobile number existence check
    const blogger_mobile = await User.findOne({mobile});

    if (blogger_mobile) {
        return ("This mobile number already exists.");
    }


    //No conflict
    else {
        return ("No Conflict");
    }
}



//******************************************************************************** */
//              duplicate 'username' and 'mobile' check - Editing Profile
//******************************************************************************** */

async function duplicate_edit_validator(username, mobile, session)
{
    // find user with duplicate 'username'
    const blogger_username = await User.findOne({ username, _id: { $ne: session._id } }, (err) => {
        if (err) new Error(err);
    });

    // find user with duplicate 'mobile'
    const blogger_mobile = await User.findOne({ mobile, _id: { $ne: session._id  } }, (err) => {
        if (err) new Error(err);
    });


    //both 'username' and 'mobile' conflict
    if (blogger_username && blogger_mobile) {
        return ("Username and Mobile are duplicate to another user(s).");
    }

    //'username' conflict
    else if (blogger_username) {
        return ("Username is duplicate to another user.");
    }

    //'mobile' conflict
    else if (blogger_mobile) {
        return ("Mobile is duplicate to another user.");
    }

    //No conflict
    else {
        return ("No Conflict");
    }
}



//******************************************************************************** */
//                      duplicate 'title'  - Adding Article
//******************************************************************************** */

async function duplicate_title_validator(title)
{
    // find article with duplicate 'title'
    const article_title = await Article.findOne({ title });


    //'title' conflict
    if (article_title) {
        return ("Title is duplicate to another article's.");
    }

    //No conflict
    else {
        return ("No Conflict");
    }
}



//************************************************************** */
//            chcek 'article_id' to be user's own article 
//************************************************************** */

async function has_article(article_id, user_id) 
{  
    //find article
    let article_author = await Article.findById(article_id, (err) => {
        if (err) new Error(err);
    });

    if (!article_author) {
        return ("Article not found");
    }
    else {
        article_author.populate("author");
    }

    //check if the user tries to change other people's article avatar
    if (article_author.author._id != user_id) {
        return ("You can NOT change other people's article avatar.")
    }


    return true;
}



//************************************************************** */
//            chcek 'comment_id' to be user's own comment 
//************************************************************** */

async function has_comment(comment_id, user_id) 
{  
    //find comment
    let comment_author = await Comment.findById(comment_id, (err) => {
        if (err) new Error(err);
    });

    if (!comment_author) {
        return ("Comment not found");
    }
    else {
        comment_author.populate("author");
    }


    //check if the user tries to delete other people's comment
    if (comment_author.author_id._id != user_id) {
        return ("You can NOT delete other people's comment.")
    }


    return true;
}





module.exports = CHECKER;