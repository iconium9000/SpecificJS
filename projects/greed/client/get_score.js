module.exports = () => {
  const score_map = [
    //   0     1     2     3     4     5     6
    [    0,    0,    0,    0,    0,    0,    0],  // 0
    [    0,  100,  200, 1000, 2000, 4000, 8000],  // 1
    [    0,    0,    0,  200,  400,  800, 1600],  // 2
    [    0,    0,    0,  300,  600, 1200, 2400],  // 3
    [    0,    0,    0,  400,  800, 1600, 3200],  // 4
    [    0,   50,  100,  500, 1000, 2000, 4000],  // 5
    [    0,    0,    0,  600, 1200, 2400, 4800],  // 6
    [    0,    0,    0,    0,    0,    0,    0],  // 7
  ]

  return function score(dice) {
    const count = [0, 0,0,0, 0,0,0, 0]
    for (const idx in dice) ++count[dice[idx]]

    let score = 0, idx = 0
    while (idx < 6) if (count[++idx] == 1) ++score
    if (score == 6) {
      dice.splice(0,6, 0,0,0, 0,0,0)
      return 3000
    }
    else score = 0


    idx = 0; while (idx < 6) if (count[++idx] == 2) ++score
    if (score == 3) {
      dice.splice(0,6, 0,0,0, 0,0,0)
      return 1000
    }
    else score = 0
    for (const val in count) score += score_map[val][count[val]]

    let die = 0; while (die < dice.length) {
      const val = dice[die]
      if (score_map[val][count[val]] > 0) dice.splice(die,1)
      else ++die
    }
    return score
  }
}
