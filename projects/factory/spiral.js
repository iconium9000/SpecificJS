const {log} = console


function print(...argv) {
  let str = ''
  for (const i in argv) str += `\t${argv[i]}`
  log(str)
}
print(...'abcdefghijklmnopq')
print(...'00100000000fftf00')
const {ceil,sqrt,abs} = Math
for (let a = 1; a < 200; ++a) {
  const b = ceil(a > 6 ? (-1+sqrt(4*a + 1)) / 4 : a / 6)
  const c = b == 1 ? 6 : 8*b - 2
  const d = (c-2)/4
  const e = b == 1 ? 1 : (4*b - 2) * (b - 1) + 1
  const f = a - e

  const l = f < d ? 1 : ''
  const o = 3*d < f ? 1 : ''
  const m = !l && f < 2*d ? 1 : ''
  const n = 2*d <= f && !o ? 1 : ''

  const g = l ? f - b + 2 : ''
  const h = m ? f - b - d + 2 : ''
  const i = n ? c - f - 2*d + b - 3 : ''
  const j = o ? c - f + b - d - 2 : ''
  const k = l ? 1 - b : m || n ? b : -b

  // const p = l ? g : n ? i : k
  // const q = m ? h : o ? j : k
  const p = l ? f-b+2   : n ? c-f-2*d+b-3 : m ? b : -b
  const q = m ? f-b+2-d : o ? c-f+  b-d-2 : n ? b : -b

  print(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q)

  {
    const _p = abs(p), _q = abs(q)
    const w = _p > _q ? _p : _q

    const d = 2*w - 1 + (w == -q && p > q ? 2 : 0)
    const c = d*4+2
    const b = c == 6 ? 1 : (c + 2) / 8
    const e = b == 1 ? 1 : (4*b - 2) * (b - 1) + 1
    const l = q <= 0 && q < p && p < 2 - q ? 1 : ''
    const m = p > 0 && 1 - p < q && q < p + 1 ? 1 : ''
    const n = q > 0 && -1 - q < p && p < q ? 1 : ''
    const o = p < 0 && p - 1 < q && q < -p ? 1 : ''

    const f = l ? p-q-1 : m ? q+p+d-2 : n ? 2*d+q-p-1 : 3*d-p-q
    const a = f + e

    const g = ''
    const h = ''
    const i = ''
    const j = ''
    const k = ''

    print(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q)
  }

  print(pointToIdx(idxToPoint(a)), ...'              ', ...idxToPoint(a),'\n')
}

function idxToPoint(a) {
  if (a == 0) return [0,0]

  const b = ceil(a > 6 ? (-1+Math.sqrt(4*a + 1))/4 : a / 6)
  const c = b == 1 ? 6 : 8*b - 2
  const d = (c - 2)/4
  const f = a - (b == 1 ? 1 : (4*b - 2) * (b - 1) + 1)

  return (
    f < d ? [f-b+2,-b] :
    f < 2*d ? [b,f-b+2-d] :
    f <= 3*d ? [c-f-2*d+b-3,b] : [-b,c-f+b-d-2]
  )
}

function pointToIdx([p,q]) {
  if (p==0&&q==0) return 0

  const w = Math.abs(Math.abs(p) > Math.abs(q) ? p : q)
  const d = 2*w - 1 + (w == -q && p > q ? 2 : 0)
  const c = d*4+2
  const b = c == 6 ? 1 : (c + 2) / 8
  const e = b == 1 ? 1 : (4*b - 2) * (b - 1) + 1

  return e + (
    q <= 0 && q < p && p < 2 - q ? p-q-1 :
    p > 0 && 1-p < q && q < p+1 ? q+p+d-2 :
    q > 0 && -1-q < p && p < q ? 2*d+q-p-1 : 3*d-p-q
  )
}
