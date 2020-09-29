const nodemailer = require("nodemailer");


module.exports = function (first_name, to_email, url_link, res) {

    const transporter = nodemailer.createTransport({
        host: "webmail.surflinegh.com",
        secureConnection: true,

        auth: {
            user: 'egh00047',
            pass: 'Egy@poli1234567'
        },

    });

    const messageBody =`
<p style="font-size: 16px">Dear<strong> ${first_name},</strong></p>
<p style="font-size: 16px">You have forgotten your password and an email has been sent to reset your password.
 Please click the button below to finish resetting your password.</p>
 <br>
 <p><a href="${url_link}" style="background: #09b2e7;color:#0a0707;text-decoration: none;padding: 15px;border: 2px solid #000000;margin: 10px;font-weight: bold;border-radius: 5px">RESET PASSWORD</a></p>
 <br>
 
 <p style="font-size: 16px"><strong>If the button above does not work, copy and paste the address below into a new browser window.</strong></p>
 <p style="font-size: 16px"><span style="background: aqua;">${url_link}</span></p>
 <p style="font-size: 16px">This password reset link is only valid for <strong>24 hours</strong> after you receive this email.</p>
 <p style="font-size: 16px">If you did not ask for your password to be reset, please ignore this email.</p>
 <p style="font-size: 16px"><i>Your Surfline IT Team</i> </p>
`;

    const mailOptions = {
        from: 'spolley@surflinegh.com',
        to: to_email,
        subject: 'MME2 PM Report: Password Reset',
        html: messageBody
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error)
            return res.json({error:"error"})
        } else {
            console.log('Email sent: ' + info.response);
            return res.json({success:"success"})
        }
    });


}
