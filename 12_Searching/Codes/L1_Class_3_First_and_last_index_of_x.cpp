#include <iostream>
#include <vector>
using namespace std;

void firstAndLast(const vector<int> &arr, int x) {
    int first = -1, last = -1;
    for (int i = 0; i < (int)arr.size(); i++) {
        if (arr[i] == x) {
            if (first == -1) {
                first = i;              // only the first match
            }
            last = i;                   // every match moves last
        }
    }
    cout << "x = " << x << ": first = " << first << ", last = " << last << endl;
}

int main() {
    vector<int> arr = {4, 7, 1, 7, 9, 7, 2};
    firstAndLast(arr, 7);
    firstAndLast(arr, 4);
    firstAndLast(arr, 3);
    return 0;
}
