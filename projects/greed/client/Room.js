module.exports = Greed => class Room {

  get timer() {
    return 15000
  }

  init(id) {
    this.id = id
    this.players = {}
    this.users = {}
    this.user_turn = NaN
    this.user_list = []
    this.dice = [0,0,0, 0,0,0]

    const time = this.clock = Greed.Lib.time
    this.time_offset = this.clock - time

    this.started = false
    this.rolling = false
    this.vip = null
    this.passed = true
    this.cleared = true
    this.play_score = 0
    this.roll_score = 0
  }

  get whoseturn() {
    return this.user_list[this.user_turn]
  }
  get myturn() {
    return this.user_id != null && this.whoseturn == this.user_id
  }

  get passmsg() {
    const {canpass,canscoredice,play_score,roll_score} = this
    const points = play_score + roll_score
    let score_dice = 0, pass_dice = 0
    for (const dice_id in canscoredice) {
      if (canscoredice[dice_id]) ++score_dice
      else ++pass_dice
    }

    if (!canpass);
    else if (score_dice == 0 || pass_dice == 0 || points < 500) pass_dice = 6

    let user_turn = (this.user_turn + 1) % this.user_list.length
    const next_player = this.users[this.user_list[user_turn]].name

    const keep_points = !canpass || points < 500 ? 'No' : points
    let ans = `Keep <b>${keep_points} Points</b>`
    ans += ` and Pass <b>${pass_dice} Dice</b>`
    ans += `<br>and <b>${points < 500 ? 'No' : points} Points</b>`
    ans += ` to <b>${next_player}</b>`
    return ans
  }
  get canstart() {
    return this.vip == this.user_id && !this.started
  }
  dostart() {
    if (!this.canstart) return false
    this.started = true
    this.user_list.sort(()=>Math.random()-0.5)
    this.user_turn = 0
    return true
  }
  get canpass() {
    return this.myturn && !this.passed
  }
  dopass() {
    return this.passed ? false : this.forcepass()
  }

  get canclear() {
    return this.myturn && this.passed && !this.cleared
  }
  get canroll() {
    const {myturn,dice,passed} = this
    return myturn && (passed || 0 < Greed.Score(dice).score)
  }
  get canseldice() {
    if (!this.myturn) return [false,false,false, false,false,false]

    const ans = [], count = [NaN, 0,0,0, 0,0,0]
    for (const idx in this.dice) ++count[ans[idx] = Math.abs(this.dice[idx])]

    let score = 0, idx = 0; while (idx < 6) if (count[++idx] == 1) ++score
    if (score == 6) return [false,false,false, false,false,false]

    score = idx = 0; while (idx < 6) if (count[++idx] == 2) ++score
    if (score == 3) return [false,false,false, false,false,false]

    for (const idx in ans) {
      const val = ans[idx]
      ans[idx] = val == 1 || val == 5 || count[val] > 2
    }
    return ans
  }
  get canscoredice() {
    const count = [NaN, 0,0,0, 0,0,0]
    for (const idx in this.dice) ++count[this.dice[idx]]

    let score = 0, idx = 0; while (idx < 6) if (count[++idx] == 1) ++score
    if (score == 6) return [true,true,true, true,true,true]

    score = idx = 0; while (idx < 6) if (count[++idx] == 2) ++score
    if (score == 3) return [true,true,true, true,true,true]

    const ans = []
    for (const idx in this.dice) {
      const val = this.dice[idx]
      ans[idx] = val == 1 || val == 5 || count[val] > 2
    }
    return ans
  }

  forcepass() {
    if (!this.myturn) return false
    else if (!this.canpass) {
      this.user_turn = (this.user_turn+1) % this.user_list.length
      return true
    }

    if (this.roll_score == 0 || (this.play_score + this.roll_score) < 500) {
      this.play_score = 0
      this.roll_score = 0
      this.dice = [0,0,0, 0,0,0]
      this.cleared = true
    }
    else {
      this.play_score += this.roll_score
      this.users[this.whoseturn].score += this.play_score
      this.roll_score = 0
      this.dice = Greed.Score(this.dice).dice
      this.cleared = false
    }
    this.passed = true
    this.lost_score = -1
    this.user_turn = (this.user_turn+1) % this.user_list.length
    return true
  }
  doclear() {
    if (!this.canclear) return false
    this.dice = [0,0,0, 0,0,0]
    this.roll_score = 0
    this.play_score = 0
    this.cleared = true
    return this.doroll()
  }
  doroll() {
    if (!this.canroll) return false

    this.passed = false
    this.play_score += this.roll_score
    const {dice} = Greed.Score(this.dice)
    for (const i in dice) dice[i] = (Math.floor(Math.random() * 12) % 6) + 1
    this.roll_score = Greed.Score(this.dice = dice).score
    if (this.roll_score == 0) {
      this.lost_score = this.play_score
      this.play_score = 0

      let winners = []
      let high_score = 0
      for (const user_id in this.users) {
        const {score} = this.users[user_id]
        if (score > high_score) { winners = [user_id]; high_score = score; }
        else if (score == high_score) winners.push(user_id)
      }
      if (high_score >= 10000 && winners.length < 2) {
        this.winner = winners.pop()
        this.user_turn = NaN
      }
    }
    else this.lost_score = -1
    return true
  }
  doseldice(dice_id) {
    if (!this.canseldice[dice_id]) return false
    const {dice} = this, val = dice[dice_id], abs_val = Math.abs(val)
    if (abs_val == 1 || abs_val == 5) dice[dice_id] = -val
    else for (const i in dice) if (dice[i] == val) dice[i] = -val
    this.roll_score = Greed.Score(dice).score
    return true
  }
}
