module.exports = Greed => {

  return function Score(temp_dice) {
    const dice = []
    for (const i in temp_dice) {
      let val = temp_dice[i]
      dice[i] = 7 > val && val > 0 ? val : 0
    }

    const count = [NaN, 0,0,0, 0,0,0]
    for (const idx in dice) ++count[dice[idx]]

    let score = 0, idx = 0; while (idx < 6) if (count[++idx] == 1) ++score
    if (score == 6) return { score: 2000, dice: [0,0,0, 0,0,0] }

    score = idx = 0; while (idx < 6) if (count[++idx] == 2) ++score
    if (score == 3) return { score: 1500, dice: [0,0,0, 0,0,0] }
    else score = 0

    const flag = [false, false,false,false, false,false,false]
    if (count[1] == 1) score += 100
    else if (count[1] == 2) score += 200
    else if (count[1] == 3) score += 300

    if (count[5] == 1) score += 50
    else if (count[5] == 2) score += 100
    else if (count[5] == 3) score += 500

    if (count[2] == 3) score += 200
    if (count[3] == 3) score += 300
    if (count[4] == 3) score += 400
    if (count[5] == 3) score += 500
    if (count[6] == 3) score += 600

    for (const val in count) if (count[val] > 3) score += 1000 * (count[val]-3)

    let die = 0; while (die < dice.length) {
      const val = dice[die]
      if (val == 1 || val == 5 || count[val] > 2) dice.splice(die,1)
      else dice[die++] = 0
    }
    if (dice.length > 0) return { score:score, dice:dice }
    else return { score:score, dice:[0,0,0, 0,0,0] }
  }
}
