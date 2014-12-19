var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var db = require('./models');
var session = require('express-session');
var flash = require('connect-flash');
var bcrypt = require('bcrypt');
var Instagram = require('instagram-node-lib');
var festivalData = require('./data/festivalData.json')
var countries = festivalData.festivals.map(function(item){
	return(item.country)
}).sort();
var uniqueCountries = countries.filter(function(elem, pos) {
	return countries.indexOf(elem) == pos;
}); 
var date = festivalData.festivals.map(function(item){
	return(item.lastDeadline)
});
var arrays = festivalData.festivals.map(function(item){
	return(item.category)
});
var merged = [];
merged = merged.concat.apply(merged, arrays);
var category = merged.filter(function(elem, pos){
	return merged.indexOf(elem) == pos;
});
// var category=
// [ "Feature", 
// "Short", 
// "Student", 
// "Documentary", 
// "Horror", 
// "Narrative", 
// "Music Video", 
// "Animation", 
// "Experimental", 
// "Youth", 
// "Comedy", 
// "Live Action", 
// "Family Films", 
// "LGBT", 
// "Sci-Fi", 
// "Screenplay", 
// "TV", 
// "Action", 
// "Fantasy", 
// "Independent", 
// "Religional", 
// "Drama", 
// "International", 
// "Adventure", 
// "Web Series", 
// "Commercial", 
// "Art House", 
// "Trailer", 
// "Teen Filmmaker", 
// "Cell Shot", 
// "Biopic", 
// "Family", 
// " Youth", 
// "Music", 
// " Narrative" 
//  ]

// var monthArray = [];
// for(var i=0; i < date.length; i++) {
// 	var dateArray = date[i].split("-");
// 	var month = dateArray[1];
// 	monthArray.push(month);
// }
// var uniqueMonths = monthArray.filter(function(elem, pos){
// 	return monthArray.indexOf(elem) == pos;
// });

var monthNames = [ "January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December" ];

var name= festivalData.festivals.map(function(item){
	return(item.name)})


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));
app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: true
}));
app.use(flash());


app.use(function(req, res, next){
	req.getUser= function(){
		return req.session.user || false;
	}
	next();
});

// Alerts - set up for each page (need partial alerts ejs file)
app.get('*', function(req,res,next){
	var alerts = req.flash();
	res.locals.alerts = alerts
	res.locals.currentUser= req.getUser();
	next();
});

Instagram.set('client_id', process.env.Instagram);
Instagram.set('client_secret', process.env.Instagram_Secret);

//sign up form
app.get('/signup',function(req,res){
	res.render('signup');
});

// sign up post
app.post('/signup',function(req,res){
	db.user.findOrCreate({where: {email:req.body.email},
		defaults: {email:req.body.email, password:req.body.password, name:req.body.name}})
	.spread(function(createdUser, created){
		if(created){
			res.redirect('/login');
		}else{
			req.flash('danger', 'User already exists - please log in');
            res.redirect('/login');
		}
		
            // res.send(createdUser)
        }).catch(function(error){
        	if(error && Array.isArray(error.errors)){
            // res.send(error.errors);
            error.errors.forEach(function(errorItem){
            	req.flash('danger', errorItem.message);
            })
        }else{
        	res.flash('danger','unknown error');
        }
        res.redirect('/signup');
    })
    });

//login form
app.get('/login',function(req,res){
	res.render('login');
});

// login post form
app.post('/login',function(req,res){
    //do login here (check password and set session value)
    db.user.find({where:{email: req.body.email}}).then(function(userObj){
    	if(userObj){
            // check password
            bcrypt.compare(req.body.password, userObj.password, function(err, match){
            	if(match === true){
            		req.session.user = {
            			id: userObj.id,
            			email: userObj.email,
            			name: userObj.name
            		};
            		res.redirect('/search');
            	}
            	else{
            		req.flash('danger', 'Invalid password - failed!');
            		res.redirect('/login');
            	}
            })
        }else{
        	req.flash('danger', 'Unknown user...');
        	res.redirect('/login');
        }
        // res.send(userObj);
    })
});

// Home Page
app.get('/search', function(req,res){
	var user = req.getUser();
			res.render('search', {uniqueCountries:uniqueCountries, category:category,
			 monthNames:monthNames, user:user});
})

// About Page
app.get('/about', function(req,res){
	Instagram.users.recent({ user_id: 3724687, 
		complete: function(data){
	res.render("about",{data:data})
}
})
});

// Landing Page
app.get('/', function(req,res){
	res.render('home')
})

// Festivals & Search Page
app.get('/festivals', function(req,res){

	var festivals = festivalData.festivals
	var startDate = req.query.startDate ? new Date(req.query.startDate) : new Date('1/1/1900')
	var endDate = req.query.endDate ? new Date(req.query.endDate) : new Date('1/1/2111')
	if(req.query.startDate || req.query.endDate){
		festivals=festivals.filter(function(item){
			var newDate=new Date(item.lastDeadline);
			return (newDate > startDate && newDate < endDate);
		})
	}
	if(req.query.fee){
		festivals=festivals.filter(function(item){
				return (item.fee == req.query.fee);
		})
	}
	if(req.query.country){
		festivals=festivals.filter(function(item){
			return (item.country == req.query.country);
		})	
	}
	if(req.query.category){
		if(!Array.isArray(req.query.category)) req.query.category = [req.query.category];
		var catLists = [];
		req.query.category.forEach(function(category){
			catLists.push(festivals.filter(function(item){
				return (item.category.indexOf(category) > -1);
			}));
		});

		festivals=[];

		catLists.forEach(function(thisList){
			festivals=festivals.concat(thisList);
		});

		//re remove duplicates
		festivals.filter(function(elem, pos){
			return festivals.indexOf(elem) == pos;
		});
	}
	// res.send(req.query.category)
	res.render("festivals", {festivals:festivals});
})

// Each Festival Page
app.get('/id/:festivalName', function(req,res){
	var params = req.params.festivalName
	var user = req.getUser();
	var festivals = festivalData.festivals
	for (var i=0; i <festivals.length; i++) {
		if (params == festivals[i].name) {
			var oneFestival = festivals[i]
			// console.log("THE ONEFESTIVAL IS:" + oneFestival.name)
			db.favorite.count({where: {name:oneFestival.name, userId:user.id}}).then(function(foundItemCount){
				// res.send(foundItemCount)
				console.log("THE NAME IS: " +oneFestival.name)
				var wasFound= foundItemCount > 0;
				var realName = oneFestival.name.split(",")
				realName = realName[0].split(" ").join("")
				console.log(realName)
				Instagram.tags.recent({ name: realName, 
					complete: function(data){
						// res.send(data)
						res.render("id", {festivalFound:wasFound, festivals:festivals, name:name, oneFestival:oneFestival, data:data})
					}
				})
			})

		}
	}
})

// Go to Favorites page
app.get("/favoriteList", function(req,res){
	if(req.getUser()){
	var user=req.getUser(); 
	var data= db.favorite.findAll({where: {userId:user.id},order: 'id ASC'}).then(function(data){ 
		res.render('favoriteList', {"festivals": data});
	})
}
else{
	req.flash('danger', 'Please log in to view your favorites page');
        res.redirect('/login');
}
});

// Delete Favorite 
app.delete("/favoriteList/:id", function(req,res){
	db.favorite.destroy({where: {id: req.params.id}})
	.then(function(deleteCount){
		res.send({deleted: deleteCount})
	})

})

// Add Info to Favorite Festival
app.post('/favoriteList', function(req,res){
	var user=req.getUser();
	var data= req.body;
	data.userId = user.id;
	var created = db.favorite.findOrCreate({where: data})
	.spread(function(createdUser, created){
		res.redirect('favoriteList')
	})
})

// Comments Page
app.get("/favoriteList:id/comments",function(req,res){
	if(req.getUser()){
var commentID = req.params.id
db.favorite.find({where: {id: req.params.id}}).then(function(watchThing){
  // res.send(watchThing)
  db.comment.findAll({where:{favoriteId:commentID}}).then(function(returnMe){
  // res.send({returnMe:returnMe})
res.render("comments", {commentID:commentID, returnMe:returnMe, watchThing:watchThing});
})
})
}

else{
	req.flash('danger', 'Please log in to view comments');
        res.redirect('/login');
}

})

// Display comments
app.post("/favoriteList:id/comments",function(req,res){
  db.favorite.find({where: {id: req.params.id}}).then(function(newComment){
  newComment.createComment({text: req.body.text, watch_id:req.params.id})
  .then(function(theComment){
    res.redirect("comments")
  })
})
})

//logout
//sign up form
app.get('/logout',function(req,res){
	delete req.session.user;
	req.flash('info', 'You have been logged out.');
	res.redirect('/search');
});

app.listen(process.env.PORT || 3000)