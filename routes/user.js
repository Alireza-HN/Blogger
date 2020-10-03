//node_modules
const express = require('express');
const session = require('express-session');
const router = express.Router();
const colors = require('colors');

//models
const User = require('../models/user.js');

//tools
const INPUT_VALIDATOR = require('../tools/input-validator-server.js');
const CHECKER = require('../tools/checker.js');


//******************************************************************************** */
//                                   Authentication
//******************************************************************************** */

// *****************************************************
//                        Check Session
// *****************************************************

//check if user is logged-in to access non-permitted sections for non-registered users
const check_session = function (req, res, next) 
{  
    //for requests wtih method GET
    if (!req.session.user && req.method === "GET") {     
        return res.redirect('/signin');
    }

    //for AJAX requests with methods rather than GET
    else if (!req.session.user) {
        return res.sendStatus(403);
    }

    next();
}


//******************************************************************************** */
//                                  Show Dashboard
//******************************************************************************** */

router.get('/dashboard', check_session, (req, res) =>
{
    //blogger login
    if (req.session.user.role === "blogger")
    {
        return res.render("dashboard-blogger.ejs", 
        {
            fname: req.session.user.firstName,
            lname: req.session.user.lastName,
            uname: req.session.user.username,
            gender: req.session.user.sex,
            mobile: req.session.user.mobile
        });
    }


    //admin login
    else if (req.session.user.role === "admin")
    {
        return res.render("dashboard-admin.ejs",
        {
            fname: req.session.user.firstName,
            lname: req.session.user.lastName,
            uname: req.session.user.username,
            gender: req.session.user.sex,
            mobile: req.session.user.mobile
        });
    }


    else {
        res.redirect('/signin');
    }
});



//******************************************************************************** */
//                                  Edit Profile
//******************************************************************************** */

//duplicate username' and 'mobile' check
router.post('/edit', check_session, async (req, res) => 
{
    try 
    {
        //************************************************************** */
        //                        Input Validation     
        //************************************************************** */

        //result of input-validation --> 'true' if there is no error
        let duplicate_validation_result = INPUT_VALIDATOR.duplicate(req.body);
    
        //if sign-in data has any errors
        if (duplicate_validation_result !== true) {
            return res.send(duplicate_validation_result);
        }

        //************************************************************** */
        //                         Data Base Check  
        //************************************************************** */

        let duplicate_check_result = await CHECKER.duplicate_edit(
            req.body.username, req.body.mobile, req.session.user);
        
        if (duplicate_check_result === "No Conflict") {
            return res.send("No Conflict");
        }

        else {
            return res.status(409).send(`${duplicate_check_result}`);
        }
    }

    catch (err) {
        console.log(colors.brightRed("\n" + err + "\n"));
        res.status(500).send("Something went wrong! Try again.");
    }
});



//update profile
router.put('/edit', check_session, async (req, res) => 
{
    try
    {
        //************************************************************** */
        //                        Input Validation     
        //************************************************************** */

        //result of input-validation --> 'true' if there is no error
        let edit_validation_result = INPUT_VALIDATOR.edit(req.body);
    
        //if sign-in data has any errors
        if (edit_validation_result !== true) {
            return res.send(edit_validation_result);
        }


        //************************************************************** */
        //              duplicate 'username' and 'mobile' check    
        //************************************************************** */

        let duplicate_check_result = await CHECKER.duplicate_edit(
            req.body.username, req.body.mobile, req.session.user);
        
        if (duplicate_check_result !== "No Conflict") {
            return res.status(409).send(`${duplicate_check_result}`);
        }


        //************************************************************** */
        //                         Data Base Update  
        //************************************************************** */

        await User.findByIdAndUpdate(req.session.user._id, 
            {firstName: req.body.fname, lastName: req.body.lname, username: req.body.username, mobile: req.body.mobile, sex: req.body.sex}, 
            {new: true}, 
            (err, user) => {
                if (err) {
                    return console.log(colors.brightRed("\nError in database update:\n" + err));
                }
                return res.sendStatus(200);
        });
    }

    catch (err) {
        console.log(colors.brightRed("\n" + err + "\n"));
        res.status(500).send("Something went wrong! Try again.");
    }
});



//change password
router.put('/password', check_session, async (req, res) => 
{
    try
    {
        //************************************************************** */
        //                        Input Validation     
        //************************************************************** */

        //result of input-validation --> 'true' if there is no error
        let edit_validation_result = INPUT_VALIDATOR.p_change(req.body);
    
        //if sign-in data has any errors
        if (edit_validation_result !== true) {
            return res.send(edit_validation_result);
        }


        //************************************************************** */
        //                           Data Base  
        //************************************************************** */

        //find user
        const blogger = await User.findById(req.session.user._id, (err, user) => {
            if (err) throw err;
        });

        //if user not found or be deleted
        if (!blogger) {
            return res.status(404).send("User not found.");
        }


        // check user's previous password
        await blogger.compare_password(req.body.old, function(err, is_match) 
        {
            if (err) throw err;


            // if password matches
            if (is_match === true) 
            {
                //change user's password
                blogger.password = req.body.new;

                //save to db
                blogger.save((err) => {
                    if (err) return res.status(500).send("Something went wrong! Try again.");

                    return res.send("Password Changed.");
                });
            }

            // if password does NOT match
            else {
                return res.status(404).send("Password is not correct.");
            }
        });
    }

    catch (err) {
        console.log(colors.brightRed("\n" + err + "\n"));
        res.status(500).send("Something went wrong! Try again.");
    }
});


//******************************************************************************** */
//                                      Log Out
//******************************************************************************** */

//destroy user session and clear cookie
router.delete('/', (req, res) =>
{  
    req.session.destroy((err) => 
    {
        if (err) {
            console.log("\nSession destroy failed:\n" + err + "\n");
            return res.sendStatus(500);
        }

        res.clearCookie("user_sid");
        res.send('/signin');
    });
});





module.exports = router;