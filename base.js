//Presence.state = function () {
//	return "online";
//}

Router.route('/', function () {
}); // blank route to prevent home page spam from IR

Template.registerHelper('mrcLoadBase', function () {
	if (Meteor.user()) {
		if (!Meteor.user().profile || !Meteor.user().username)
			return "mrc_newuser";
		return "mrc_base";
	}
	else
		return (Template["my_login"]) ? "my_login" : "mrc_login";
});

Template.registerHelper('mrcLoadBrand', function () {
		return (Template["my_brand"]) ? "my_brand" : "mrc_brand";
});

Template.mrc_newuser.events({
	'keyup': function () {
		validateForm(false);
	},
	'click #submit': function (event) {
		event.preventDefault();

		// Validate Form
		var valid = validateForm(true);
		if (!valid)
			return false;

		// Update User
		var form = getForm();
		if (form.realname)
			Meteor.users.update({_id: Meteor.user()._id}, {$set: {"profile.name": form.realname}});

		if (form.gender)
			Meteor.users.update({_id: Meteor.user()._id}, {$set: {"profile.gender": form.gender}});

		if (form.username)
			Meteor.call('setUsername', form.username);

		if (form.password)
			//Accounts.setPassword(Meteor.user()._id, form.password);
			//Meteor.users.update({_id: Meteor.user()._id}, {$set: {"password": form.password}});

			// Always return false, form disappears live once profile is complete
			return false;
	}
});
Template.mrc_newuser.helpers({
	'nameInput': function () {
		if (!Meteor.user().profile || !Meteor.user().profile.name) {
			var html = '<div class="form-group"><label class="col-md-4 control-label" for="realname">Real name</label><div class="col-md-6">';
			html += '<input id="realname" name="realname" type="text" class="form-control input-md" placeholder="John Doe">';
			html += '</div></div>';
			return html;
		}
		return false;
	},
	'gender': function () {
		if (!Meteor.user().profile || !Meteor.user().profile.gender) {
			Meteor.call('setGender');
			var html = '<div class="form-group"><label class="col-md-4 control-label" for="gender">Gender</label><div class="col-md-6">';
			html += '<label class="radio-inline" for="gender-0"><input type="radio" name="gender" id="gender-0" value="male" checked="checked">Male</label>';
			html += '<label class="radio-inline" for="gender-1"><input type="radio" name="gender" id="gender-1" value="female">Female</label>';
			html += '</div></div>';
			return html;
		}
		return false;
	}
});

/*
 
 
 */

Template.mrc_base.onRendered(function () {
	renderEnv();
	$(window).resize(function () {
		renderEnv();
	});
	setTimeout(function() { scrollToBottom() }, 200);
	setTimeout(function() { scrollToBottom() }, 500);
});

Template.mrc_base.helpers({
	'username': function () {
		return Meteor.user().profile.name;
	},
	'messages': function () {
		// Session get roomID for multiroom
		var messages = Meteor.messages.find({}, {sort: {date: 1}});
		var html = '';
		messages.forEach(function (msg) {
			//var nick = Meteor.users.findOne(msg.sender).username;
			var nick = Meteor.users.findOne(msg.sender).profile.name;
			var time = new Date(msg.date);
			var h = (time.getHours() < 10) ? '0' + time.getHours() : time.getHours();
			var m = time.getMinutes();
			html += '<p class=""><span class="time">' + h + ':' + m + '</span> <span class="name">' + nick + ':</span> ' + msg.message + '</p>';
		});

		if (isAtBottom()) {
			scrollToBottom();
		} else {
			//increase unread
		}
		
		return html;
	},
	'roomName': function () {
		return 'Temp..';
	},
	'roomUsers': function () {
		var users = Meteor.presences.find({state: "online"});
		var html = '';
		users.forEach(function (user) {
			//var nick = Meteor.users.findOne(user._id).username;
			var nick = Meteor.users.findOne(user.userId).profile.name;
			html += '<p class="gue">' + nick + '</p>';
		});
		return html;
	}
});

Template.mrc_base.events({
	'click #brand': function () {
		var html = (Template["my_brand_pop"]) ? Blaze.toHTMLWithData(Template.my_brand_pop) : Blaze.toHTMLWithData(Template.mrc_brand_pop);
		bootbox.dialog({
			title: "About",
			message: html,
			onEscape: true,
			closeButton: true,
			buttons: {
				alert: {
					label: "Ok",
					className: "btn-primary",
					callback: function () {
						bootbox.hideAll();
					}
				}
			}
		});
	},
	'submit #mrc-send': function (event) {
		event.preventDefault();
		var message = $('#mrc-input').val();
		var room = Meteor.rooms.findOne({droom:true})._id;
		Meteor.messages.insert({
			date: new Date(),
			sender: Meteor.user()._id,
			room: room,
			message: message
		}, function(err) {
			if (err)
				return false;
			$('#mrc-input').val('');
		});
	}

});

function isAtBottom() {
	var out = document.getElementById("mrc-chatarea");
	if (!out) return false;
	var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;
	return isScrolledToBottom;
}

function scrollToBottom() {
	var elm = document.getElementById("mrc-chatarea");
	var scr = elm.scrollHeight;
	$('#mrc-chatarea').animate({scrollTop: scr}, 'fast');
}

function renderEnv() {
	var h = $(window).height();
	$('#mrc-chatarea').css('height', h - 90 + 'px').css('top', '50px').css('padding', '0');
	$('#mrc-namearea').css('height', h - 50 + 'px');
}

function getForm() {
	var form = {};
	$.each($('form').serializeArray(), function () {
		form[this.name] = this.value;
	});
	return form;
}

function validateForm(submit) {
	var form = getForm();

	$('.help-block').remove();
	$('.form-group').removeClass('has-error');
	$('.form-group').removeClass('has-warning');
	$('.form-group').removeClass('has-success');
	var ann = /^[a-z0-9]+$/i;
	var ans = /^[a-z0-9 ]+$/i;
	var err = false;

	// Realname Validation
	if (submit && form.realname && form.realname === "") {
		$('#realname').parent().parent().addClass('has-error');
		$('#realname').after('<span class="help-block">Required</span>');
		err = true;
	}
	else if (form.realname && form.realname !== "" && (form.realname.length < 3 || form.realname.length > 50)) {
		$('#realname').parent().parent().addClass('has-error');
		$('#realname').after('<span class="help-block">Between 3 and 50 characters</span>');
		err = true;
	}
	else if (form.realname && form.realname !== "" && !ans.test(form.realname)) {
		$('#realname').parent().parent().addClass('has-error');
		$('#realname').after('<span class="help-block">Letters, numbers and spaces only</span>');
		err = true;
	}
	else if (form.realname && form.realname !== "") {
		$('#realname').parent().parent().addClass('has-success');
		err = false;
	}

	// Username Validation
	if (submit && form.username === "") {
		$('#username').parent().parent().addClass('has-error');
		$('#username').after('<span class="help-block">Required</span>');
		err = true;
	}
	else if (form.username !== "" && (form.username.length < 3 || form.username.length > 15)) {
		$('#username').parent().parent().addClass('has-error');
		$('#username').after('<span class="help-block">Between 3 and 15 characters</span>');
		err = true;
	}
	else if (form.username !== "" && !ann.test(form.username)) {
		$('#username').parent().parent().addClass('has-error');
		$('#username').after('<span class="help-block">Letters and numbers only</span>');
		err = true;
	}
	else if (form.username !== "" && Meteor.users.findOne({username: form.username})) {
		$('#username').parent().parent().addClass('has-error');
		$('#username').after('<span class="help-block">Username exists</span>');
		err = true;
	}
	else if (form.username !== "") {
		Meteor.call("checkUsername", form.username, function (error, result) {
			if (result) {
				$('#username').parent().parent().addClass('has-success');
				err = false;
			}
			else {
				$('#username').parent().parent().addClass('has-error');
				$('#username').after('<span class="help-block">Username exists</span>');
				err = true;
			}
		});
	}

	if (err)
		return false;

	return true;
}
