#include <iostream>
using namespace std;

int moves = 0;

void hanoi(int n, char from, char to, char helper) {
    if (n == 0) return;                      // no disks to move
    hanoi(n - 1, from, helper, to);          // 1. park n-1 disks on the helper
    moves++;
    cout << "Move disk " << n << " from " << from << " to " << to << endl;  // 2. move the biggest
    hanoi(n - 1, helper, to, from);          // 3. bring n-1 disks on top of it
}

int main() {
    int n = 3;
    hanoi(n, 'A', 'C', 'B');
    cout << "Total moves = " << moves << " (2^" << n << " - 1)" << endl;
    return 0;
}
