const bcrypt = require('bcrypt');
const User = require("./models/user");
const LocalStrategy = require("passport-local").Strategy;


function initializePassport(passport){
    const authenticateUser = async (username, password,done)=>{
        try {
            const user = await User.findOne({username: username.toLowerCase()});
            if (user) {
                let isValid = await bcrypt.compare(password, user.password);
                if (isValid) return done(null, user);
                else return done(null, false, {message: "Invalid Password"})
            }
            done(null, false, {message: "Invalid Username"})
        } catch (e) {
            done(e)
        }

    };

    passport.use(new LocalStrategy(authenticateUser));
    passport.serializeUser(((user, done) => {
        done(null, user.id);
    }));
    passport.deserializeUser((id, done) => {
       User.findById(id, function (err, user) {
           if (err) done(err);
           else done(null, user);


       })

    })

}


module.exports = initializePassport;
