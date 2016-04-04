'use strict';

var questions = [];


var answers=[];

var GAME_LENGTH = 10;
var CARD_TITLE = "Splash Math Quiz"; // Be sure to change this for your skill.

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);


//     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
//         context.fail("Invalid Application ID");
//      }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;


    if (session.attributes && session.attributes.userPromptedToContinue) {
        delete session.attributes.userPromptedToContinue;
        if ("AMAZON.NoIntent" === intentName) {
            handleFinishSessionRequest(intent, session, "", callback);
        } else if ("AMAZON.YesIntent" === intentName) {
            handleRepeatRequest(intent, session, callback);
        }
    }

    switch(intentName){
        case "NameIntent":
            if(session.attributes && session.attributes.userNamePrompt){
                delete  session.attributes.userNamePrompt;
                handleNameRequest(intent, session, callback);
            }
            break;
        case "GradeIntent":
            if(session.attributes && session.attributes.userGradePrompt){
                delete  session.attributes.userGradePrompt;
                handleGradeRequest(intent, session, callback);
            }
            break;
        case "AnswerIntent":
        case "AnswerOnlyIntent":
        case "DontKnowIntent":
        case "AMAZON.NoIntent":
        case "AMAZON.YesIntent":
            handleAnswerRequest(intent, session, callback);
            break;
        case "AMAZON.StartOverIntent":
            getWelcomeResponse(callback);
            break;
        case "AMAZON.RepeatIntent":
            handleRepeatRequest(intent, session, callback);
            break;
        case "AMAZON.HelpIntent":
            handleGetHelpRequest(intent, session, callback);
            break;
        case "AMAZON.StopIntent":
        case "AMAZON.CancelIntent":
            handleFinishSessionRequest(intent, session, "", callback);
            break;
        default:
            handleInvalidRequest(intent, session, callback);
            break;

    }

}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}


function getWelcomeResponse(callback) {
    var sessionAttributes = {},
        speechOutput = "Hello, I am Alexa. What is your name? Please say my name is ... ",
        shouldEndSession = false,
        currentQuestionIndex = 0;

    askName(speechOutput, callback);
}

function populateGameQuestionsByGradeLevel(gradeLevel) {
    var level = gradeLevel? gradeLevel: 0,
        range= (gradeLevel + 1) * 10,
        lowerRange = range===10? range: range-10;
    console.log("gradeLevel " + gradeLevel.toString());
    if (gradeLevel > 4) {
        range = 100;
    }

    for (var j = 0; j < GAME_LENGTH; j++){
        var randNumber1 = Math.floor(Math.random() * lowerRange);
        var randNumber2 = Math.floor(Math.random() * range);
        var temp =0;

        if (j % 2=== 0){
            questions.push("What is " + randNumber1 + " plus " + randNumber2 + "?");
            answers.push(randNumber1 + randNumber2);

        } else {
            if (randNumber1 < randNumber2) {
                temp = randNumber1;
                randNumber1 = randNumber2;
                randNumber2 = temp;
            }
            questions.push("What is " + randNumber1 + " minus " + randNumber2 + "?");
            answers.push(randNumber1 - randNumber2);
        }
    }

    return {
        "questions": questions,
        "answers": answers
    };

}

function askName(speechOutput, callback){
    var sessionAttributes = {
        "userNamePrompt": true
    };

    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}

function handleNameRequest(intent, session, callback) {
    var name = "Kid",
        speechOutput = "";

    if (intent.slots && intent.slots.FirstName){
        name = intent.slots.FirstName.value;
    }

    speechOutput = "Hi, " + name +  ", very nice to talk to you! What grade are you in? " +
        " Is it k for Kindergarten,  1 for First grade, 2 for Second Grade," +
        " 3 for Third Grade, Other for Higher than all of the above ? " +
        " For example : My Grade is 1 ";

    var sessionAttributes = {
        "name": name,
        "userGradePrompt": true
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));

}

function handleGradeRequest(intent, session, callback){
    var grade = "1st grade",
        sessionAttributes ={},
        speechOutput = "",
        level=0,
        questionText;

    if (intent.slots && intent.slots.SchoolGrade){
        grade = intent.slots.SchoolGrade.value;
    }

    switch(grade) {
        case "1":
            level =1;
            speechOutput = "First grader, "
            break;
        case "2":
            level = 2;
            speechOutput = "Second grader, "
            break;
        case "3":
            level=3;
            speechOutput = "Third grader, "
            break;
        case "other":
            level =5;
            speechOutput = "Looks like you are a math magician. "
            break;
        case "k":
            level=0;
            speechOutput = "Kindergartener, "
            break;
        default:
            speechOutput = " ... so you are a kindergartener. "
            level = 0;
            break;
    }

    var qas = populateGameQuestionsByGradeLevel(level);

    speechOutput = "Very good. " + speechOutput + " Shall we start our math quiz today? " +
        " I will ask you " +  GAME_LENGTH.toString() +
        " questions, try to get as many right as you can. Let's begin. ";


    questionText = "Question 1. " + qas.questions[0] + " ";
    sessionAttributes = {
        "name":  "",
        "questions": qas.questions,
        "answers": qas.answers,
        "speechOutput": speechOutput +  questionText,
        "repromptText": questionText,
        "currentQuestionIndex": 0,
        "score": 0,
        "correctAnswerText":qas.answers[0]
    };

    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput + questionText, questionText, false));

}


function handleAnswerRequest(intent, session, callback) {
    var speechOutput = "";
    var sessionAttributes = {};
    var gameInProgress = session.attributes && session.attributes.questions;
    var userGaveUp = intent.name === "DontKnowIntent";

    var currentScore = 0;
    var currentQuestionIndex =0;
    var correctAnswerText =session.attributes && session.attributes.correctAnswerText || "";

    if(session.attributes.score) {
        currentScore = parseInt(session.attributes.score);
    }

    if ( session.attributes.currentQuestionIndex){
        currentQuestionIndex = parseInt(session.attributes.currentQuestionIndex);
    }
    console.log(currentScore, currentQuestionIndex);
    if (!gameInProgress) {
        // If the user responded with an answer but there is no game in progress, ask the user
        // if they want to start a new game. Set a flag to track that we've prompted the user.
        sessionAttributes.userPromptedToContinue = true;
        speechOutput = "There is no game in progress. Do you want to start a new game? ";
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
    }  else if (userGaveUp) {
        askQuestion(currentQuestionIndex+1, currentScore,"I am sorry to hear that. Neither do I. ", callback );

    } else  if (intent.slots && intent.slots.Answer){

        var speechOutputAnalysis = "";
        var answer;
        answer = parseInt(intent.slots.Answer.value);
        if (answer == correctAnswerText) {
            currentScore = currentScore + 10;
            speechOutputAnalysis = "correct. ";
        } else {
            speechOutputAnalysis = "wrong. "
            speechOutputAnalysis += "The correct answer is "  + correctAnswerText + ". ";
        }
        // if currentQuestionIndex is 4, we've reached 5 questions (zero-indexed) and can exit the game session
        if (currentQuestionIndex >= GAME_LENGTH - 1) {
            speechOutput = "That answer is ";
            speechOutput += speechOutputAnalysis + "You got " + currentScore.toString() + " out of "
                + (GAME_LENGTH * 10).toString() + ". Thank you for playing. !";
            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, "", true));
        } else {
            speechOutput =  "That answer is ";
            speechOutput += speechOutputAnalysis + "Your score is " + currentScore.toString() + ". ";

            askQuestion(currentQuestionIndex+1, currentScore, speechOutput, callback);
        }
    }
    else {
        speechOutput =  "Sorry, I cannot understand you. ";
        askQuestion(currentQuestionIndex, currentScore, speechOutput, callback);
    }


}


function askQuestion(currentQuestionIndex, currentScore, speechOutput, callback){
    var spokenQuestion = questions[currentQuestionIndex];

    if (currentQuestionIndex> GAME_LENGTH-1){
        throw "Invalid request for current question index" + currentQuestionIndex;
    }
    var questionIndexForSpeech = currentQuestionIndex + 1,
        speech,
        repromptText = "Question " + questionIndexForSpeech.toString() + ". " + spokenQuestion + " ",
        sessionAttributes = {};

    speech = speechOutput + repromptText;

    sessionAttributes = {
        "speechOutput": speech,
        "repromptText": repromptText,
        "currentQuestionIndex": currentQuestionIndex,
        "questions": questions,
        "answers": answers,
        "score": currentScore,
        "correctAnswerText": answers[currentQuestionIndex]
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));

}

function handleRepeatRequest(intent, session, callback) {
    // Repeat the previous speechOutput and repromptText from the session attributes if available
    // else start a new game session
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
    }
}

function handleInvalidRequest(intent, session, callback ){
    handleFinishSessionRequest(session, "Sorry I have trouble understanding you. Need a break now. Goodbye ", callback);
}

function handleGetHelpRequest(intent, session, callback) {
    // Provide a help prompt for the user, explaining how the game is played. Then, continue the game
    // if there is one in progress, or provide the option to start another one.

    // Set a flag to track that we're in the Help state.
    session.attributes.userPromptedToContinue = true;

    // Do not edit the help dialogue. This has been created by the Alexa team to demonstrate best practices.

    var speechOutput = "I will ask you " + GAME_LENGTH + " multiple choice questions. Respond with your answer. "
            + "To start a new game at any time, say, start game. "
            + "To repeat the last question, say, repeat. "
            + "Would you like to keep playing?",
        repromptText = "To give an answer to a question, respond with the number of the answer . "
            + "Would you like to keep playing?";
    var shouldEndSession = false;
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, speech, callback) {
    var speechOutPut = speech? speech : "Good bye!";
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speech, "", true));
}


// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}