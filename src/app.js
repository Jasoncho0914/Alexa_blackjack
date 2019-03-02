'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');

const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new FileDb()
);


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

// You start with 100 dollars

const card_score = {'ace':1, 'two':2, 'three':3, 'four':4, 'five':5, 'six':6, 'seven':7,'eight':8, 'nine':9, 'ten':10, 'queen':10,'jack':10, 'king':10};
// const card_score = {'ace':1, 'two':2, 'three':3, 'four':4, 'five':5, 'six':6, 'seven':7,'eight':8, 'nine':9, 'ten':10};

const card = ['ace','two','three','four','five','six','seven','eight','nine','ten','jack','queen','king'];
// const card = ['ace','two','three','four','five','six','seven','eight','nine','ten'];

const rand = [1,1,1,1,1,0,0,0,0,0];

const break_time = '150ms';
const short_break = '20ms';

//Bug -> Pushed bet, next game I all in, lose, but the game doesn't go to "game over" state.

app.setHandler({
    LAUNCH() {
      return this.toStateIntent('asking_name','HelloWorldIntent');
    },
    Unhandled(){
        return this.toStateIntent('asking_name','HelloWorldIntent');
    },

    asking_name:{
      HelloWorldIntent() {
          this.followUpState('name_confirm').ask('Welcome to blackjack game! What\'s your name?', 'Please tell me your name.');
      },
    },

    name_confirm:{
      MyNameIsIntent() {
        this.$app.$data.temp_name = this.$inputs.name.value;
        this.$speech.addText('Is your name').addBreak(break_time).addText(this.$app.$data.temp_name+'?');
        this.followUpState('name_confirm_2').ask(this.$speech,this.$speech);
      },
    },

    name_confirm_2:{
      YesIntent() {
        this.$app.$data.name = this.$app.$data.temp_name;
        delete this.$app.$data.temp_name;
        this.$app.$data.money = 500;
        this.$app.$data.pushed = 0;
        this.$app.$data.enter = 1;
        return this.toStateIntent('name_state','MynameSpeak');
      },

      NoIntent() {
        return this.toStateIntent('asking_name','HelloWorldIntent');
      },

      Unhandled() {
        return this.toStateIntent('asking_name','HelloWorldIntent');
      },
    },

    name_state:{
      MynameSpeak(){
          let name = this.$app.$data.name;
          let money = this.$app.$data.money;

          this.$speech.addText('Hey').addText(name).addBreak(short_break).addText('nice to meet you.').addBreak(short_break)
          .addText('Let\'s play Blackjack. Every player starts with').addSayAsCardinal(money).addText('dollars.')
          .addText('Say "start" to start playing! And if you want to stop playing, just say "exit"');

          this.followUpState('starting_position').ask(this.$speech,this.$speech);
      },
      Unhandled() {
        this.followUpState('starting_position').ask('Say "start" to start playing.');
      },

    },

    starting_position:{
      game_starter(){
        if (this.$app.$data.money < 10){
          this.tell('Sorry, you don\'t have enough money to play, game over');
        }

        let pushed = this.$app.$data.pushed;

        this.$speech.addText(this.$app.$data.name,this.$app.$data.enter == 1).addBreak(short_break,this.$app.$data.enter == 1)
        .addText(' You currently have ',this.$app.$data.enter == 1).addBreak(short_break,this.$app.$data.enter == 1)
        .addSayAsCardinal(this.$app.$data.money,this.$app.$data.enter == 1).addText('dollars.',this.$app.$data.enter == 1)
        .addText('You can bet as low as ten dollars and up to one hundred dollars. The smallest unit is one dollar.',this.$app.$data.enter == 1)
        .addText('How much would you like to bet?')
        .addBreak(break_time,pushed != 0).addText('You also have pushed bet from the last game of',pushed != 0).addBreak(break_time,pushed != 0).addText(pushed,pushed != 0)
        .addBreak(break_time,pushed != 0).addText('dollars',pushed > 1).addText('dollar',pushed == 1);
        this.$app.$data.enter = 0;
        this.followUpState('betting_state').ask(this.$speech,this.$speech);
        },

      Unhandled(){
        this.followUpState('betting_state').ask('how much would you like to bet?, if you want to stop playing, say "exit"');
      },
    },

    betting_state:{
      betting(){
        var messup = rand[Math.floor(Math.random() * rand.length)];
        let temp = Math.round(this.$inputs.money.value);

        if (isNaN(temp)){
          this.ask('your input is not valid. How much would you like to bet?','your input is not valid. How much would you like to bet?');
        }

        if (messup == 1){
          if (temp == 10){
            temp = 20;
          }
          else if (temp == 11){
            temp = 18;
          }
          else if (temp<20 && temp>11){
            temp = temp-10;
            temp = temp*10;
          }
          else if(Math.floor(temp*0.1)*10 == temp && temp>19 && temp<100){
            temp = Math.floor(temp*0.1)+10;
          }
          else if (temp == 100){
            temp = 80;
          }
          else if(temp>19){
            temp = Math.floor(temp*0.1)*10;
          }
        }

        if (temp > 100) {
          this.$speech.addText('You can\'t bet').addBreak('30ms').addSayAsCardinal(temp).addBreak('30ms')
          .addText('dollars',temp>1).addText('dollar',temp == 1).addBreak('30ms').addText('The maximum bet is one hundred dollars');
          this.ask(this.$speech,this.$speech);
          }

        else if (temp > this.$app.$data.money && temp <= 100){
          this.$speech.addText('You can\'t bet').addBreak('30ms').addSayAsCardinal(temp).addBreak('30ms')
          .addText('dollars',temp>1).addText('dollar',temp == 1).addText('you don\'t have enough money');
          this.ask(this.$speech,this.$speech);
        }

        else if (temp < 10){
          this.$speech.addText('You can\'t bet').addBreak('30ms').addSayAsCardinal(temp).addBreak('30ms')
          .addText('dollars',temp>1).addText('dollar',temp == 1).addBreak('30ms').addText('lowest you can bet is ten dollars');
          this.ask(this.$speech,this.$speech);
          }

        else{
          this.$app.$data.betting = temp;
          // this.$speech.addText('Would you like to bet').addSayAsCardinal(this.$app.$data.betting).addText('dollars?',this.$app.$data.betting>1).addText('dollar?',this.$app.$data.betting==1);
          // this.followUpState('bet_confirm').ask(this.$speech,this.$speech);
          return this.toStateIntent('game_state','card_deal');
          }
      },

      Unhandled(){
        return this.toStateIntent('starting_position','game_starter');
      },
    },
    // bet_confirm:{
    //   YesIntent(){
    //     return this.toStateIntent('game_state','card_deal');
    //   },
    //
    //   NoIntent(){
    //     return this.toStateIntent('starting_position','game_starter');
    //
    //   },
    //
    //   Unhandled(){
    //     return this.toStateIntent('starting_position','game_starter');
    //   },
    // },

    game_state:{
      card_deal(){
        this.$app.$data.money = this.$app.$data.money - this.$app.$data.betting;
        this.$app.$data.player_first_card = card[Math.floor(Math.random() * card.length)];
        this.$app.$data.player_second_card = card[Math.floor(Math.random() * card.length)];
        // this.$app.$data.player_first_card = 'ace';
        // this.$app.$data.player_second_card = 'ace';
        this.$app.$data.player_has_ace = 0;


        this.$app.$data.dealer_first_card =  card[Math.floor(Math.random() * card.length)];
        this.$app.$data.dealer_second_card = card[Math.floor(Math.random() * card.length)];
        // this.$app.$data.dealer_first_card =  'queen';
        // this.$app.$data.dealer_second_card = 'six';
        this.$app.$data.dealer_has_ace = 0;


        if (this.$app.$data.player_first_card == 'ace' || this.$app.$data.player_second_card == 'ace'){
          this.$app.$data.player_total_2 = card_score[this.$app.$data.player_first_card] + card_score[this.$app.$data.player_second_card]+10;
          this.$app.$data.player_has_ace = 1;
            if (this.$app.$data.player_total_2 == 21){
              return this.toStateIntent('game_state','automatic_win');
            }
          }
        this.$app.$data.player_total = card_score[this.$app.$data.player_first_card]+card_score[this.$app.$data.player_second_card];

        if (this.$app.$data.dealer_first_card == 'ace' || this.$app.$data.dealer_second_card == 'ace'){
          this.$app.$data.dealer_total_2 = card_score[this.$app.$data.dealer_first_card] + card_score[this.$app.$data.dealer_second_card]+10;
          this.$app.$data.dealer_has_ace = 1;
          if (this.$app.$data.dealer_total_2 == 21){
            return this.toStateIntent('game_state','automatic_lose');
          }
        }
        this.$app.$data.dealer_total = card_score[this.$app.$data.dealer_first_card]+card_score[this.$app.$data.dealer_second_card];

        return this.toStateIntent('game_state','game_start');
      },

      automatic_win(){
        this.$app.$data.money = this.$app.$data.money + (this.$app.$data.betting + this.$app.$data.pushed)*2;

        this.$speech.addText('You bet').addBreak('100ms').addSayAsCardinal(this.$app.$data.betting).addBreak('100ms').addText('dollars',this.$app.$data.betting>1).addText('dollar',this.$app.$data.betting == 1).addBreak(break_time)
        .addText('and',this.$app.$data.pushed!=0).addBreak(break_time,this.$app.$data.pushed!=0).addSayAsCardinal(this.$app.$data.pushed,this.$app.$data.pushed!=0)
        .addText('from your previous game.',this.$app.$data.pushed!=0).addBreak(break_time,this.$app.$data.pushed!=0)
        .addText('You are dealt').addBreak(break_time).addText(this.$app.$data.player_first_card).addBreak(break_time).addText(' and ').addBreak(break_time).addText(this.$app.$data.player_second_card)
        .addBreak(break_time).addText('You have Blackjack! Congratulation, you automatically win.').addBreak(break_time)
        .addText('You now have').addBreak(break_time).addSayAsCardinal(this.$app.$data.money).addBreak(break_time).addText('dollars',this.$app.$data.money>1).addText('dollar',this.$app.$data.money == 1)
        .addBreak(break_time).addText('Say "start" to keep playing!');

        this.$app.$data.pushed = 0;
        this.followUpState('starting_position').ask(this.$speech,this.$speech);
      },

      automatic_lose(){

        this.$speech.addText('You bet').addBreak('100ms').addSayAsCardinal(this.$app.$data.betting).addBreak('100ms').addText('dollars',this.$app.$data.betting>1).addText('dollar',this.$app.$data.betting == 1).addBreak(break_time)
        .addText('and',this.$app.$data.pushed!=0).addBreak(break_time,this.$app.$data.pushed!=0).addSayAsCardinal(this.$app.$data.pushed,this.$app.$data.pushed!=0)
        .addText('from your previous game.',this.$app.$data.pushed!=0).addBreak(break_time,this.$app.$data.pushed!=0)
        .addText('You are dealt').addBreak(break_time).addText(this.$app.$data.player_first_card).addBreak(break_time).addText(' and ').addBreak(break_time).addText(this.$app.$data.player_second_card)
        .addBreak(break_time).addText('for a total of ').addBreak(break_time).addSayAsCardinal(this.$app.$data.player_total).addBreak(break_time,this.$app.$data.player_has_ace == 1)
        .addText('or',this.$app.$data.player_has_ace == 1).addBreak(break_time).addSayAsCardinal(this.$app.$data.player_total_2,this.$app.$data.player_has_ace == 1)
        .addBreak(break_time).addText('I have').addBreak(break_time).addText(this.$app.$data.dealer_second_card).addBreak(break_time)
        .addText('showing.').addBreak(break_time).addText('Checking if I have Blackjack.').addBreak(break_time).addText('I have ').addBreak(break_time).addText(this.$app.$data.dealer_first_card)
        .addBreak(break_time).addText(' and ').addBreak(break_time).addText(this.$app.$data.dealer_second_card).addBreak(break_time).addText('for Blackjack. I win.').addBreak(break_time)
        .addText('You now have').addBreak(break_time).addSayAsCardinal(this.$app.$data.money).addBreak(break_time).addText('dollars',this.$app.$data.money>1).addText('dollar',this.$app.$data.money == 1)
        .addBreak(break_time).addText('Say "start" to keep playing!',this.$app.$data.money != 0);

        this.$app.$data.pushed = 0;

        if(this.$app.$data.money != 0){
          this.followUpState('starting_position').ask(this.$speech,this.$speech);
        }

        else{
          this.$speech.addText('You lost all your money. Game Over.');
          this.tell(this.$speech);
        }
      },

      game_start(){
        this.$speech.addText('You bet').addBreak('100ms').addSayAsCardinal(this.$app.$data.betting).addBreak('100ms').addText('dollars',this.$app.$data.betting>1).addText('dollar',this.$app.$data.betting == 1).addBreak(break_time)
        .addText('and',this.$app.$data.pushed!=0).addBreak(break_time,this.$app.$data.pushed!=0).addSayAsCardinal(this.$app.$data.pushed,this.$app.$data.pushed!=0)
        .addText('from your previous game.',this.$app.$data.pushed!=0).addBreak(break_time,this.$app.$data.pushed!=0)
        .addText('You are dealt').addBreak(break_time).addText(this.$app.$data.player_first_card).addBreak(break_time).addText(' and ').addBreak(break_time).addText(this.$app.$data.player_second_card)
        .addBreak(break_time).addText('for a total of ').addBreak(break_time).addSayAsCardinal(this.$app.$data.player_total).addBreak(break_time,this.$app.$data.player_has_ace == 1)
        .addText('or',this.$app.$data.player_has_ace == 1).addBreak(break_time).addSayAsCardinal(this.$app.$data.player_total_2,this.$app.$data.player_has_ace == 1)
        .addBreak(break_time).addText('I have').addBreak(break_time).addText(this.$app.$data.dealer_second_card).addBreak(break_time)
        .addText('showing.').addBreak(break_time).addText('Checking if I have Blackjack.',card_score[this.$app.$data.dealer_second_card]==1 || card_score[this.$app.$data.dealer_second_card]==10)
        .addBreak(break_time).addText('I do not have Blackjack',card_score[this.$app.$data.dealer_second_card]==1 || card_score[this.$app.$data.dealer_second_card]==10)
        .addBreak(break_time).addText('Would you like to hit, or stand?')

        this.followUpState('player_action').ask(this.$speech,this.$speech);
      },
    },

    player_action:{
      status(){
        this.$speech.addText('You hit.').addBreak(break_time).addText('You are dealt').addBreak(break_time).addText(this.$app.$data.player_next_card).addBreak(break_time).addText('for a total of ')
        .addBreak(break_time).addSayAsCardinal(this.$app.$data.player_total).addBreak(break_time).addText('Would you like to hit, or stand?');
        this.$app.$data.mistake = 0;

        this.followUpState('player_action').ask(this.$speech,this.$speech);
      },

      status_2(){
        // Two possible total values because of Ace
        this.$speech.addText('you hit.').addBreak(break_time).addText('You are dealt').addBreak(break_time).addText(this.$app.$data.player_next_card).addBreak(break_time).addText('for a total of ')
        .addBreak(break_time).addSayAsCardinal(this.$app.$data.player_total).addBreak(break_time).addText('or').addBreak(break_time)
        .addSayAsCardinal(this.$app.$data.player_total_2).addBreak(break_time).addText('Would you like to hit, or stand?');
        this.$app.$data.mistake = 0;

        this.followUpState('player_action').ask(this.$speech,this.$speech);
      },

      busted(){
        // Busted with one possible outcome
        this.$speech.addText('you hit.').addBreak(break_time).addText('You are dealt').addBreak(break_time).addText(this.$app.$data.player_next_card).addBreak(break_time).addText('for a total of ')
        .addBreak(break_time).addSayAsCardinal(this.$app.$data.player_total).addBreak(break_time).addText('You lost.').addBreak(break_time)
        .addText('You now have').addBreak(break_time).addSayAsCardinal(this.$app.$data.money).addBreak(break_time).addText('dollars',this.$app.$data.money>1).addText('dollar',this.$app.$data.money == 1)
        .addBreak(break_time,this.$app.$data.money != 0).addText('Say "start" to keep playing!',this.$app.$data.money != 0);

        this.$app.$data.pushed = 0;

        if(this.$app.$data.money != 0){
          this.followUpState('starting_position').ask(this.$speech,this.$speech);
        }
        else{
          this.$speech.addText('You lost all your money. Game Over.');
          this.tell(this.$speech);
        }
      },

      busted_2(){
        // two cards were both busted
        this.$speech.addText('You hit.').addBreak(break_time).addText('You are dealt').addBreak(break_time).addText(this.$app.$data.player_next_card).addBreak(break_time).addText('for a total of ')
        .addBreak(break_time).addSayAsCardinal(this.$app.$data.player_total).addBreak(break_time).addText('or').addBreak(break_time)
        .addSayAsCardinal(this.$app.$data.player_total_2).addBreak(break_time).addText('You lost.').addBreak(break_time)
        .addText('You now have').addBreak(break_time).addSayAsCardinal(this.$app.$data.money).addBreak(break_time).addText('dollars',this.$app.$data.money>1).addText('dollar',this.$app.$data.money == 1)
        .addBreak(break_time,this.$app.$data.money != 0).addText('Say "start" to keep playing!',this.$app.$data.money != 0);

        this.$app.$data.pushed = 0;

        if(this.$app.$data.money != 0){
          this.followUpState('starting_position').ask(this.$speech,this.$speech);
        }
        else{
          this.$speech.addText('You lost all your money. Game Over.');
          this.tell(this.$speech);
        }
      },

      hit() {
        var messup_2 = rand[Math.floor(Math.random() * rand.length)];

        if (messup_2 == 1 && this.$app.$data.mistake != 1) {
          this.$app.$data.mistake = 1;
          return this.toStateIntent('player_action','stand');
        }


        var hit = card[Math.floor(Math.random() * card.length)];
        // var hit = 'ace';
        this.$app.$data.player_next_card = hit;

        if (hit == 'ace') {
          if(this.$app.$data.player_has_ace == 0) {
              this.$app.$data.player_has_ace = 1;
            }
          if (this.$app.$data.player_total > 11) {
              this.$app.$data.player_total = this.$app.$data.player_total + 1;
              if(this.$app.$data.player_total > 21){
                this.$app.$data.mistake = 0;
                return this.toStateIntent('player_action','busted');
              }
              else{
                this.$app.$data.mistake = 0;
                return this.toStateIntent('player_action','status');
              }
            }
          else if (this.$app.$data.player_total < 12){
            this.$app.$data.player_total = this.$app.$data.player_total + 1;
            this.$app.$data.player_total_2 = this.$app.$data.player_total + 10;

            if(this.$app.$data.player_total < 12){
              this.$app.$data.mistake = 0;
              return this.toStateIntent('player_action','status_2'); //two of them are alive
            }
            else if(this.$app.$data.player_total > 11 && this.$app.$data.player_total < 22){
              delete this.$app.$data.player_total_2;
              this.$app.$data.mistake = 0;
              return this.toStateIntent('player_action','status'); //only one of them is alive
            }
            else if(this.$app.$data.player_total > 21){
              this.$app.$data.mistake = 0;
              return this.toStateIntent('player_action','busted_2');
            }
          }
        }

        else if (hit != 'ace' && this.$app.$data.player_has_ace == 0){
          this.$app.$data.player_total = this.$app.$data.player_total + card_score[hit];
          if(this.$app.$data.player_total > 21){
            this.$app.$data.mistake = 0;
            return this.toStateIntent('player_action','busted');
          }
          else{
            this.$app.$data.mistake = 0;
            return this.toStateIntent('player_action','status');
          }
        }

        else if (hit != 'ace' && this.$app.$data.player_has_ace == 1){
          if (this.$app.$data.player_total > 11){
              this.$app.$data.player_total = this.$app.$data.player_total + card_score[hit];
              if(this.$app.$data.player_total > 21){
                this.$app.$data.mistake = 0;
                return this.toStateIntent('player_action','busted');
              }
              else{
                this.$app.$data.mistake = 0;
                return this.toStateIntent('player_action','status');
              }
          }
          else if (this.$app.$data.player_total < 12){
            this.$app.$data.player_total = this.$app.$data.player_total + card_score[hit];
            this.$app.$data.player_total_2 = this.$app.$data.player_total_2 + card_score[hit];
            if(this.$app.$data.player_total < 12){
              this.$app.$data.mistake = 0;
              return this.toStateIntent('player_action','status_2'); //two of them are alive
            }
            else if(this.$app.$data.player_total > 11 && this.$app.$data.player_total < 22){
              delete this.$app.$data.player_total_2;
              this.$app.$data.mistake = 0;
              return this.toStateIntent('player_action','status'); //only one of them is alive
            }
            else if(this.$app.$data.player_total > 21){
              this.$app.$data.mistake = 0;
              return this.toStateIntent('player_action','busted_2');
            }
          }
        }



      },

      stand(){
        var messup_3 = rand[Math.floor(Math.random() * rand.length)];

        if (messup_3 == 1 && this.$app.$data.mistake != 1){
          this.$app.$data.mistake = 1;
          return this.toStateIntent('player_action','hit');
        }

        if (this.$app.$data.player_has_ace == 1 & this.$app.$data.player_total < 12){
          this.$app.$data.player_stand = this.$app.$data.player_total_2;
        }
        else{
          this.$app.$data.player_stand = this.$app.$data.player_total;
        }

        this.$app.$data.mistake = 0;
        return this.toStateIntent('dealer_action','show');
      },

      Unhandled(){
        this.followUpState('player_action').ask('Would you like to hit, or stand?');
      },

    },
    dealer_action:{
      show(){

        this.$speech.addText('You stand at').addBreak('30ms').addSayAsCardinal(this.$app.$data.player_stand).addBreak('30ms')
        .addText('I have').addBreak(break_time).addText(this.$app.$data.dealer_second_card).addBreak(break_time)
        .addText('showing.').addBreak(break_time).addText('Another card I have is').addBreak(break_time).addText(this.$app.$data.dealer_first_card).addBreak(break_time)
        .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_total).addBreak(break_time,this.$app.$data.dealer_has_ace == 1)
        .addText('or',this.$app.$data.dealer_has_ace == 1).addBreak(break_time,this.$app.$data.dealer_has_ace == 1).addSayAsCardinal(this.$app.$data.dealer_total_2,this.$app.$data.dealer_has_ace == 1)
        .addBreak(break_time,(this.$app.$data.dealer_total < 17 && this.$app.$data.dealer_has_ace == 0) || (this.$app.$data.dealer_has_ace == 1 && this.$app.$data.dealer_total_2<17))
        .addText('I have to hit until I have seveteen or more points',(this.$app.$data.dealer_total < 17 && this.$app.$data.dealer_has_ace == 0) || (this.$app.$data.dealer_has_ace == 1 && this.$app.$data.dealer_total_2<17));

        if(this.$app.$data.dealer_total>16){
          this.$app.$data.dealer_stand = this.$app.$data.dealer_total;
        }

        else if(this.$app.$data.dealer_has_ace == 1 && this.$app.$data.dealer_total_2 > 16){
          this.$app.$data.dealer_stand = this.$app.$data.dealer_total_2;
        }

        else{
          this.$app.$data.dealer_stand = 0;
          while(this.$app.$data.dealer_stand < 17){
            var hit_2 = card[Math.floor(Math.random() * card.length)];

            if (hit_2 == 'ace'){
              if(this.$app.$data.dealer_has_ace == 0){
                this.$app.$data.dealer_has_ace = 1;
              }
              if (this.$app.$data.dealer_total > 11) {
                  this.$app.$data.dealer_total = this.$app.$data.dealer_total + 1;
                  this.$app.$data.dealer_stand = this.$app.$data.dealer_total;
                  this.$speech.addBreak(break_time).addText('I drew').addBreak(break_time).addText('ace').addBreak(break_time)
                  .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_stand);

                }

              else if (this.$app.$data.dealer_total < 12){
                  this.$app.$data.dealer_total = this.$app.$data.dealer_total + 1;
                  this.$app.$data.dealer_total_2 = this.$app.$data.dealer_total + 10;

                  if(this.$app.$data.dealer_total < 12){
                    //both of them are alive
                    this.$app.$data.dealer_stand = this.$app.$data.dealer_total_2;
                    this.$speech.addBreak(break_time).addText('I drew').addBreak(break_time).addText('ace').addBreak(break_time)
                    .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_total).addBreak(break_time).addText('or').addBreak(break_time)
                    .addSayAsCardinal(this.$app.$data.dealer_total_2);

                  }
                  else if(this.$app.$data.dealer_total > 11 && this.$app.$data.dealer_total < 22){
                    delete this.$app.$data.dealer_total_2;

                    this.$app.$data.dealer_stand = this.$app.$data.dealer_total;
                    this.$speech.addBreak(break_time).addText('I drew').addBreak(break_time).addText('ace').addBreak(break_time)
                    .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_total);

                  }
                }
            }

            else if (hit_2 != 'ace' && this.$app.$data.dealer_has_ace == 0){
              this.$app.$data.dealer_total = this.$app.$data.dealer_total + card_score[hit_2];

              if(this.$app.$data.dealer_total > 21){
                this.$app.$data.player_stand = this.$app.$data.dealer_total;
                this.$app.$data.money = this.$app.$data.money + (this.$app.$data.betting + this.$app.$data.pushed)*2;

                this.$speech.addBreak(break_time).addText('I drew').addBreak(break_time).addText(hit_2).addBreak(break_time)
                .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_total).addText('and Busted. You win.').addBreak(break_time)
                .addText('You now have').addBreak(break_time).addSayAsCardinal(this.$app.$data.money).addBreak(break_time)
                .addText('dollars',this.$app.$data.money > 1).addText('dollar',this.$app.$data.money == 1)
                .addBreak(break_time).addText('Say "start" to keep playing!');

                this.$app.$data.dealer_speech = this.$speech;
                this.$app.$data.pushed = 0;

                return this.toStateIntent('dealer_action','dealer_busted');
                // this.followUpState('starting_position').ask(this.$speech,this.$speech);
              }
              else{
                this.$app.$data.dealer_stand = this.$app.$data.dealer_total;
                this.$speech.addBreak(break_time).addText('I drew').addBreak(break_time).addText(hit_2).addBreak(break_time)
                .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_total);
              }
            }

            else if (hit_2 != 'ace' && this.$app.$data.dealer_has_ace == 1){
              if (this.$app.$data.dealer_total > 11){
                  this.$app.$data.dealer_total = this.$app.$data.dealer_total + card_score[hit_2];
                  if(this.$app.$data.dealer_total > 21){
                    this.$app.$data.money = this.$app.$data.money + (this.$app.$data.betting + this.$app.$data.pushed)*2;
                    this.$speech.addBreak(break_time).addText('I drew').addBreak(break_time).addText(hit_2).addBreak(break_time)
                    .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_total).addBreak(break_time)
                    .addText('and Busted. You win.').addBreak(break_time)
                    .addText('You now have').addBreak(break_time).addSayAsCardinal(this.$app.$data.money).addBreak(break_time).addText('dollars',this.$app.$data.money>1).addText('dollar',this.$app.$data.money == 1)
                    .addBreak(break_time).addText('Say "start" to keep playing!');
                    this.$app.$data.dealer_speech = this.$speech;
                    this.$app.$data.pushed = 0;

                    return this.toStateIntent('dealer_action','dealer_busted');

                  }
                  else{
                    this.$app.$data.dealer_stand = this.$app.$data.dealer_total;
                    this.$speech.addBreak(break_time).addText('I drew').addBreak(break_time).addText(hit_2).addBreak(break_time)
                    .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_total);
                  }
              }
              else if (this.$app.$data.dealer_total < 12){
                this.$app.$data.dealer_total = this.$app.$data.dealer_total + card_score[hit_2];
                this.$app.$data.dealer_total_2 = this.$app.$data.dealer_total_2 + card_score[hit_2];

                if(this.$app.$data.dealer_total < 12){
                  this.$app.$data.dealer_stand = this.$app.$data.dealer_total_2;
                  this.$speech.addBreak(break_time).addText('I drew').addBreak(break_time).addText(hit_2).addBreak(break_time)
                  .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_total).addBreak(break_time).addText('or').addBreak(break_time)
                  .addSayAsCardinal(this.$app.$data.dealer_total_2);  //two of them are alive

                }
                else if(this.$app.$data.dealer_total > 11 && this.$app.$data.dealer_total < 22){
                  delete this.$app.$data.dealer_total_2;
                  this.$app.$data.dealer_stand = this.$app.$data.dealer_total;
                  this.$speech.addBreak(break_time).addText('I drew').addBreak(break_time).addText(hit_2).addBreak(break_time)
                  .addText('for a total of').addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_total); //only one of them is alive
                }
            }
        }
          }
        }

        if(this.$app.$data.dealer_stand > this.$app.$data.player_stand){
          this.$speech.addBreak(break_time).addText('I stand at')
          .addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_stand).addBreak(break_time)
          .addText('You have').addBreak(break_time).addSayAsCardinal(this.$app.$data.player_stand)
          .addBreak(break_time).addText('You lose.').addBreak(break_time)
          .addText('You now have').addBreak(break_time).addSayAsCardinal(this.$app.$data.money).addBreak(break_time).addText('dollars',this.$app.$data.money>1).addText('dollar',this.$app.$data.money == 1)
          .addBreak(break_time).addText('Say "start" to keep playing!',this.$app.$data.money != 0);

          this.$app.$data.pushed = 0;
          if(this.$app.$data.money != 0){
            this.followUpState('starting_position').ask(this.$speech,this.$speech);
          }
          else{
            this.$speech.addText('You lost all your money. Game Over.');
            this.tell(this.$speech);
          }

        }

        else if (this.$app.$data.dealer_stand < this.$app.$data.player_stand){
          this.$app.$data.money = this.$app.$data.money + (this.$app.$data.betting+this.$app.$data.pushed)*2;
          this.$speech.addBreak(break_time).addText('I stand at')
          .addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_stand).addBreak(break_time)
          .addText('You have').addBreak(break_time).addSayAsCardinal(this.$app.$data.player_stand)
          .addBreak(break_time).addText('You win!').addBreak(break_time)
          .addText('You now have').addBreak(break_time).addSayAsCardinal(this.$app.$data.money).addBreak(break_time).addText('dollars',this.$app.$data.money>1).addText('dollar',this.$app.$data.money == 1)
          .addBreak(break_time).addText('Say "start" to keep playing!');

          this.$app.$data.pushed = 0;
          this.followUpState('starting_position').ask(this.$speech,this.$speech);
        }

        else if (this.$app.$data.dealer_stand == this.$app.$data.player_stand){
          this.$app.$data.pushed = this.$app.$data.pushed+this.$app.$data.betting;
          this.$speech.addBreak(break_time).addText('I stand at')
          .addBreak(break_time).addSayAsCardinal(this.$app.$data.dealer_stand).addBreak(break_time)
          .addText('You have').addBreak(break_time).addSayAsCardinal(this.$app.$data.player_stand)
          .addBreak(break_time).addText('Tied game. Your bet has been pushed over to the next game.').addBreak(break_time)
          .addText('Continue Playing by saying "start."',this.$app.$data.money != 0);

          if(this.$app.$data.money != 0){
            this.followUpState('starting_position').ask(this.$speech,this.$speech);
          }
          else{
            this.$speech.addText('You lost all your money. Game Over.');
            this.tell(this.$speech);
          }
        }
      },
    dealer_busted(){
      this.followUpState('starting_position').ask(this.$app.$data.dealer_speech,this.$app.$data.dealer_speech);
    },

    },
});

module.exports.app = app;
