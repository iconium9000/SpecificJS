// g++ -o app main.cpp

#include <iostream>
#include <fstream>
#include <vector>
#include <queue>
#include <stack>
#define null nullptr
using namespace std;

#define SANITY 1e8
#define SHIFT 3
#define MASK 3

int next(int& argi, int argc, char* argv[]) {
  if (argi < argc) return atoi(argv[argi++]);
  else {
    cout << argi << ' ' << argc << endl;
    throw -1;
  }
}

struct State {
  vector<State*> _states;
  int _depth, *_key_parents;

  State(int*key_parents,int depth) : _key_parents(key_parents), _depth(depth) {}
  ~State() { delete[] _key_parents; }

  string toString(int nKeys) {
    string s = "keys";
    if (_key_parents != null) {
      for (int iKey = 0; iKey < nKeys; ++iKey) {
        s += ' ' + to_string(_key_parents[iKey]);
      }
    }
    return s;
  }
};

struct Hash {
  Hash* _hash;
  State* _state;
  Hash() : _hash(null), _state(null) {}
};

class Solver {
private:
  int _iSlot,_iLock,_iRoom,_iJack,_iKey,_iXey,_iPortal,_iDoor,_iHeader,_nRooms;
  int _key_bounds[4];
  int *_portal_rooms = null, *_lock_rooms = null;
  int *_lock_gates = null, *_gate_spec = null;
  int **_room_locks = null, **_room_doors = null;
  int *_gate_count = null;

  int *_iJack_parents = null, *_iKey_parents = null, *_iXey_parents = null;

  Hash _hash;
  State* _root;
  queue<State*> _stateQueue;
  vector<State*> _wins, _solve;
  stack<int*> _free_key_parents;

  State* get_state(int* key_parents) {
    Hash* hash = &_hash;
    for (int iKey = 0; iKey < _iXey; ++iKey) {
      if (hash->_hash == null) return null;
      hash = &hash->_hash[key_parents[iKey]];
    }
    return hash->_state;
  }

  State* set_state(int* key_parents, int depth) {
    State* state; Hash *hash = &_hash;
    for (int iKey = 0; iKey < _iXey; ++iKey) {
      if (hash->_hash == null) hash->_hash = new Hash[_iRoom];
      hash = &hash->_hash[key_parents[iKey]];
    }
    state = hash->_state = new State(key_parents,depth+1);
    _stateQueue.push(state);
    return state;
  }

  void move(
    State& state, int iParentA, int iParentB,
    int iJack, int iKey, int iXey
  ) {
    State* _state; int _iKey,keyType,low,high, *_key_parents;
    int iKeys[3] = {iJack,iKey,iXey};

    if (_free_key_parents.empty()) _key_parents = new int[_iXey];
    else {
      _key_parents = _free_key_parents.top();
      _free_key_parents.pop();
    }

    for (_iKey = 0; _iKey < _iXey; ++_iKey) {
      _key_parents[_iKey] = state._key_parents[_iKey];
    }

    // cout << "\nmove " << iParentA << ' ' << iParentB << " :";
    // cout << ' ' << iJack << ' ' << iKey << ' ' << iXey << " :";
    // for (_iKey = 0; _iKey < _iXey; ++_iKey) {
    //   cout << ' ' << _key_parents[_iKey];
    // }

    for (keyType = 0; keyType < 3; ++keyType) {
      _iKey = iKeys[keyType];
      if (_iKey < 0) continue;


      low = _key_bounds[keyType];
      while (low < _iKey && iParentB < _key_parents[_iKey-1]) {
        _key_parents[_iKey] = _key_parents[_iKey-1]; --_iKey;
      }

      high = _key_bounds[1+keyType]-1;
      while (high > _iKey && iParentB > _key_parents[_iKey+1]) {
        _key_parents[_iKey] = _key_parents[_iKey+1]; ++_iKey;
      }
      _key_parents[_iKey] = iParentB;
    }

    _state = get_state(_key_parents);
    if (_state != null) _free_key_parents.push(_key_parents);
    else {
      _state = set_state(_key_parents, state._depth);
    }
    state._states.push_back(_state);

    // cout << " ->";
    // for (_iKey = 0; _iKey < _iXey; ++_iKey) {
    //   cout << ' ' << _key_parents[_iKey];
    // }

  }

  void solve(State& state) {
    int iGate,iDoor,iLock,iJack,iKey,iXey,iParent,iPortal;
    int iPortalA,iPortalB,iParentA,iParentB;
    int iJackA,iJackB,iKeyA,iKeyB,iXeyA,iXeyB;
    int *locks, *doors, *key_parents = state._key_parents, *iKey_parents;

    // cout << "\n\nslove :";
    // for (iKey = 0; iKey < _iXey; ++iKey) {
    //   cout << ' ' << key_parents[iKey];
    // }

    for (iGate = 0; iGate < _iHeader; ++iGate) _gate_count[iGate] = 0;
    for (iParent = 0; iParent < _iRoom; ++iParent) {
      _iJack_parents[iParent] = -1;
      _iKey_parents[iParent] = -1;
      _iXey_parents[iParent] = -1;
    }
    for (iKey = 0; iKey < _iXey; ++iKey) {
      iParent = key_parents[iKey];
      if (iParent < _iLock) ++_gate_count[_lock_gates[iParent]];
      if (iKey < _iJack) _iJack_parents[iParent] = iKey;
      else if (iKey < _iKey) _iKey_parents[iParent] = iKey;
      else _iXey_parents[iParent] = iKey;
    }
    if (_gate_count[_iDoor] == _gate_spec[_iDoor]) _wins.push_back(&state);

    iPortalA = iPortalB = -1;
    for (iPortal = 0; iPortal < _iPortal; ++iPortal) {
      if (_gate_count[iPortal] == _gate_spec[iPortal]) {
        if (iPortalA == -1) iPortalA = iPortal;
        else if (iPortalB == -1) iPortalB = iPortal;
        else {
          iPortalA = iPortalB = -1;
          break;
        }
      }
    }
    if (iPortalB != -1) {
      iParentA = _portal_rooms[iPortalA];
      iParentB = _portal_rooms[iPortalB];

      if (iParentA != iParentB) {
        iJackA = _iJack_parents[iParentA];
        iJackB = _iJack_parents[iParentB];

        if (iJackA != -1) {
          move(state, iParentA, iParentB, iJackA,-1,-1);

          iKey = _iKey_parents[iParentA];
          iXey = _iXey_parents[iParentA];

          if (iKey != -1) move(state, iParentA, iParentB, iJackA, iKey, -1);

          if (iXey != -1) move(state, iParentA, iParentB, iJackA, -1, iXey);
        }
        if (iJackB != -1) {
          move(state, iParentB, iParentA, iJackB,-1,-1);

          iKey = _iKey_parents[iParentB];
          iXey = _iXey_parents[iParentB];
          if (iKey != -1) move(state, iParentB, iParentA, iJackB, iKey, -1);

          if (iXey != -1) move(state, iParentB, iParentA, iJackB, -1, iXey);

        }
      }
    }

    iParent = -1;
    for (iJack = 0; iJack < _iJack; ++iJack) {
      iParentA = key_parents[iJack];

      if (iParentA == iParent);
      else if (iParentA < _iLock) {
        move(state, iParentA, _lock_rooms[iParentA], iJack, -1, -1);
      }
      else {

        locks = _room_locks[iParentA - _iLock];
        for (iLock = 1; iLock <= locks[0]; ++iLock) {
          iParentB = locks[iLock];
          if (_iJack_parents[iParentB] != -1) continue;

          iKey_parents = iParentB < _iSlot ? _iXey_parents : _iKey_parents;

          iKeyB = iKey_parents[iParentB];
          if (iKeyB == -1) {
            move(state, iParentA, iParentB, iJack, -1, -1);

            iKeyA = iKey_parents[iParentA];
            if (iKeyA != -1) {
              if (iKeyA < _iKey) move(state,iParentA,iParentB,-1,iKeyA,-1);
              else move(state,iParentA,iParentB,-1,-1,iKeyA);
            }
          }
          else {
            if (iKeyB < _iKey) move(state,iParentB,iParentA,-1,iKeyB,-1);
            else move(state,iParentB,iParentA,-1,-1,iKeyB);
          }
        }

        doors = _room_doors[iParentA - _iLock];
        for (iDoor = 1; iDoor <= doors[0]; iDoor += 2) {
          iGate = doors[iDoor], iParentB = doors[iDoor+1];

          if (_gate_spec[iGate] == _gate_count[iGate]) {

            move(state, iParentA, iParentB, iJack, -1, -1);

            iKey = _iKey_parents[iParentA];
            if (iKey != -1) move(state,iParentA,iParentB,iJack,iKey,-1);

            iXey = _iXey_parents[iParentA];
            if (iXey != -1) move(state,iParentA,iParentB,iJack,-1,iXey);
          }
        }
      }

      iParent = iParentA;
    }
  }

public:
  ~Solver() {
    if (_portal_rooms != null) delete[] _portal_rooms;
    if (_lock_rooms != null) delete[] _lock_rooms;
    if (_lock_gates != null) delete[] _lock_gates;
    if (_gate_spec != null) delete[] _gate_spec;
    if (_gate_count != null) delete[] _gate_count;
    if (_iJack_parents != null) delete[] _iJack_parents;
    if (_iKey_parents != null) delete[] _iKey_parents;
    if (_iXey_parents != null) delete[] _iXey_parents;

    if (_room_locks != null) {
      for (int iRoom = 0; iRoom < _nRooms; ++iRoom) delete[] _room_locks[iRoom];
      delete[] _room_locks;
    }
    if (_room_doors != null) {
      for (int iRoom = 0; iRoom < _nRooms; ++iRoom) delete[] _room_doors[iRoom];
      delete[] _room_doors;
    }

    while (!_free_key_parents.empty()) {
      delete[] _free_key_parents.top();
      _free_key_parents.pop();
    }
  }

  void init(int c, char* v[]) {

    int u = 1;
    _iSlot = next(u,c,v);
    _iLock = next(u,c,v);
    _iRoom = next(u,c,v);
    _iJack = next(u,c,v); _key_bounds[0] = 0; _key_bounds[1] = _iJack;
    _iKey = next(u,c,v); _key_bounds[2] = _iKey;
    _iXey = next(u,c,v); _key_bounds[3] = _iXey;
    _iPortal = next(u,c,v);
    _iDoor = next(u,c,v);
    _iHeader = next(u,c,v);

    _gate_count = new int[_iHeader];
    _iJack_parents = new int[_iRoom];
    _iKey_parents = new int[_iRoom];
    _iXey_parents = new int[_iRoom];

    int* key_parents = new int[_iXey];
    for (int i = 0; i < _iXey; ++i) key_parents[i] = next(u,c,v);

    _portal_rooms = new int[_iPortal];
    for (int i = 0; i < _iPortal; ++i) _portal_rooms[i] = next(u,c,v);

    _lock_rooms = new int[_iLock];
    for (int i = 0; i < _iLock; ++i) _lock_rooms[i] = next(u,c,v);

    _lock_gates = new int[_iLock];
    for (int i = 0; i < _iLock; ++i) _lock_gates[i] = next(u,c,v);

    _gate_spec = new int[_iHeader];
    for (int i = 0; i <= _iHeader; ++i) _gate_spec[i] = next(u,c,v);

    _nRooms = _iRoom - _iLock;
    _room_locks = new int*[_nRooms];
    for (int i = 0; i < _nRooms; ++i) {
      int nLocks = next(u,c,v);
      _room_locks[i] = new int[nLocks+1];
      _room_locks[i][0] = nLocks;
      for (int j = 1; j <= nLocks; ++j) _room_locks[i][j] = next(u,c,v);
    }

    _room_doors = new int*[_nRooms];
    for (int i = 0; i < _nRooms; ++i) {
      int nDoors = next(u,c,v), nDoors2 = nDoors << 1;
      _room_doors[i] = new int[nDoors2+1];
      _room_doors[i][0] = nDoors2;
      for (int j = 1; j <= nDoors2; ++j) _room_doors[i][j] = next(u,c,v);
    }

    _root = set_state(key_parents,0);
  }

  void solve_queue() {
    int d, i, j; State* state, *_state;

    for (i = 0; i < SANITY && !_stateQueue.empty(); ++i) {
       state = _stateQueue.front();
      _stateQueue.pop();
      solve(*state);
    }
    if (!_stateQueue.empty()) {
      cout << "\nSTACK OVERFLOW! " << _stateQueue.size();
    }

    state = null; d = -1;
    i = _wins.size();
    while (i > 0) {
      _state = _wins[--i];
      // if (d == -1 || _state->_depth < d) state = _state, d = _state->_depth;
      cout << '\n' << d;
      if (_state->_depth > d) state = _state, d = _state->_depth;
    }

    for (i = d; i >= 0; --i) {
      vector<State*> &states = state->_states;
      _solve.push_back(state);
      state = null; d = -1;
      j = states.size();
      while (j > 0) {
        _state = states[--j];
        if (d == -1 || _state->_depth < d) state = _state, d = _state->_depth;
      }
      if (d == -1 || d >= i) return;
    }
  }

  void output(const char* file_name) {
    ofstream fout; int iSolve,iKey; State* state;

    fout.open (file_name);
    fout << '[';
    iSolve = _solve.size();
    while (iSolve > 0) {
      state = _solve[--iSolve];
      fout << '[';
      for (iKey = 0; iKey < _iXey; ++iKey) {
        fout << (state)->_key_parents[iKey];
        if (iKey+1 < _iXey) fout << ',';
      }
      fout << ']';
      if (iSolve > 0) fout << ',';
    }
    fout << ']';
    fout.close();
  }

  void print() {
    cout << "\nsolver.cpp\n\n";

    cout << _iSlot << " _iSlot\n";
    cout << _iLock << " _iLock\n";
    cout << _iRoom << " _iRoom\n";
    cout << _iJack << " _iJack\n";
    cout << _iKey << " _iKey\n";
    cout << _iXey << " _iXey\n";
    cout << _iPortal << " _iPortal\n";
    cout << _iDoor << " _iDoor\n";
    cout << _iHeader << " _iHeader\n";

    cout << "\n_portal_rooms";
    for (int i = 0; i < _iPortal; ++i) cout << ' ' << _portal_rooms[i];

    cout << "\n_lock_rooms";
    for (int i = 0; i < _iLock; ++i) cout << ' ' << _lock_rooms[i];

    cout << "\n_lock_gates";
    for (int i = 0; i < _iLock; ++i) cout << ' ' << _lock_gates[i];

    cout << "\n_gate_spec";
    for (int i = 0; i <= _iHeader; ++i) cout << ' ' << _gate_spec[i];

    cout << "\n_room_locks";
    for (int i = 0; i < _nRooms; ++i) {
      for (int j = 0; j <= _room_locks[i][0]; ++j) {
        cout << ' ' << _room_locks[i][j];
      }
      cout << ' ';
    }

    cout << "\n_room_doors";
    for (int i = 0; i < _nRooms; ++i) {
      int nDoors2 = _room_doors[i][0];
      for (int j = 0; j <= nDoors2; ++j) {
        cout << ' ' << _room_doors[i][j];
      }
      cout << ' ';
    }

    cout << "\n_solve " << _solve.size();
    for (int i = 0; i < _solve.size(); ++i) {
      int* key_parents = _solve[i]->_key_parents;
      cout << "\n " << _solve[i]->_depth << " :";
      for (int i = 0; i < _iXey; ++i) cout << ' ' << key_parents[i];
    }

    cout << endl;
  }
};

int main(int argc, char* argv[]) {

  Solver solver;
  // try {
  solver.init(argc, argv);
  solver.solve_queue();
  solver.print();
  solver.output("solve.json");

  cout << "\nFINE!" << endl;
  // }
  return 0;
  // catch (int e) {
  //   cout << "ERROR: " << e << endl;
  //   return e;
  // }
  // catch (const exception& e) {
  //   cout << e.what() << endl;
  //   return -1;
  // }
}
