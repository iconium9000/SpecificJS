// g++ -o app main.cpp

#include <iostream>
#include <vector>
#define null nullptr
using namespace std;

class Solver {
private:
  int next(int& argi, int argc, char* argv[]) {
    if (argi < argc) return atoi(argv[argi++]);
    else {
      cout << argi << " " << argc << endl;
      throw -1;
    };
  }
public:
  ~Solver() {
    if (_key_parents != null) delete _key_parents;
    if (_portal_rooms != null) delete _portal_rooms;
    if (_lock_rooms != null) delete _lock_rooms;
    if (_lock_gates != null) delete _lock_gates;
    if (_gate_spec != null) delete _gate_spec;
    if (_gate_count != null) delete _gate_count;

    int nRooms = _iRoom - _iLock;
    if (_room_locks != null) {
      for (int i = 0; i < nRooms; ++i) delete _room_locks[i];
      delete _room_locks;
    }
    if (_room_doors != null) {
      for (int i = 0; i < nRooms; ++i) delete _room_doors[i];
      delete _room_doors;
    }
  }
  int _iSlot,_iLock,_iRoom,_iJack,_iKey,_iXey,_iPortal,_iDoor,_iHeader;

  int *_key_parents = null, *_portal_rooms = null, *_lock_rooms = null;
  int *_lock_gates = null, *_gate_spec = null, *_gate_count = null;
  int **_room_locks = null, **_room_doors = null;

  void init(int c, char* v[]) {


    int u = 1;
    _iSlot = next(u,c,v);
    _iLock = next(u,c,v);
    _iRoom = next(u,c,v);
    _iJack = next(u,c,v);
    _iKey = next(u,c,v);
    _iXey = next(u,c,v);
    _iPortal = next(u,c,v);
    _iDoor = next(u,c,v);
    _iHeader = next(u,c,v);

    _key_parents = new int[_iXey];
    for (int i = 0; i < _iXey; ++i) _key_parents[i] = next(u,c,v);

    _portal_rooms = new int[_iPortal];
    for (int i = 0; i < _iPortal; ++i) _portal_rooms[i] = next(u,c,v);

    _lock_rooms = new int[_iLock];
    for (int i = 0; i < _iLock; ++i) _lock_rooms[i] = next(u,c,v);

    _lock_gates = new int[_iLock];
    for (int i = 0; i < _iLock; ++i) _lock_gates[i] = next(u,c,v);

    _gate_spec = new int[_iHeader];
    for (int i = 0; i <= _iHeader; ++i) _gate_spec[i] = next(u,c,v);

    _gate_count = new int[_iHeader];
    for (int i = 0; i <= _iHeader; ++i) _gate_count[i] = next(u,c,v);

    int nRooms = _iRoom - _iLock;
    _room_locks = new int*[nRooms];
    for (int i = 0; i < nRooms; ++i) {
      int nLocks = next(u,c,v);
      _room_locks[i] = new int[nLocks+1];
      _room_locks[i][0] = nLocks;
      for (int j = 1; j <= nLocks; ++j) _room_locks[i][j] = next(u,c,v);
    }

    _room_doors = new int*[nRooms];
    for (int i = 0; i < nRooms; ++i) {
      int nDoors = next(u,c,v), nDoors2 = nDoors << 1;
      _room_doors[i] = new int[nDoors2+1];
      _room_doors[i][0] = nDoors2;
      for (int j = 1; j <= nDoors2; ++j) _room_doors[i][j] = next(u,c,v);
    }

    print();
  }

  void print() {
    cout << "solver.cpp\n\n";

    cout << _iSlot << " _iSlot\n";
    cout << _iLock << " _iLock\n";
    cout << _iRoom << " _iRoom\n";
    cout << _iJack << " _iJack\n";
    cout << _iKey << " _iKey\n";
    cout << _iXey << " _iXey\n";
    cout << _iPortal << " _iPortal\n";
    cout << _iDoor << " _iDoor\n";
    cout << _iHeader << " _iHeader\n";

    cout << "\n_key_parents";
    for (int i = 0; i < _iXey; ++i) cout << " " << _key_parents[i];

    cout << "\n_portal_rooms";
    for (int i = 0; i < _iPortal; ++i) cout << " " << _portal_rooms[i];

    cout << "\n_lock_rooms";
    for (int i = 0; i < _iLock; ++i) cout << " " << _lock_rooms[i];

    cout << "\n_lock_gates";
    for (int i = 0; i < _iLock; ++i) cout << " " << _lock_gates[i];

    cout << "\n_gate_spec";
    for (int i = 0; i <= _iHeader; ++i) cout << " " << _gate_spec[i];

    cout << "\n_gate_count";
    for (int i = 0; i <= _iHeader; ++i) cout << " " << _gate_count[i];

    cout << "\n_room_locks";
    int nRooms = _iRoom - _iLock;
    for (int i = 0; i < nRooms; ++i) {
      for (int j = 0; j <= _room_locks[i][0]; ++j) {
        cout << " " << _room_locks[i][j];
      }
      cout << " ";
    }

    cout << "\n_room_doors";
    for (int i = 0; i < nRooms; ++i) {
      int nDoors2 = _room_doors[i][0];
      for (int j = 0; j <= nDoors2; ++j) {
        cout << " " << _room_doors[i][j];
      }
      cout << " ";
    }

    cout << endl;
  }
};

int main(int argc, char* argv[]) {

  Solver solver;
  // try {
  solver.init(argc, argv);


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
