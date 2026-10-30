#include <iostream>
#include <vector>
using namespace std;

int linearSearch(const vector<int> &arr, int x) {
    for (int i = 0; i < (int)arr.size(); i++) {
        if (arr[i] == x) {
            return i;                   // found: stop right here
        }
    }
    return -1;                          // checked everything: not found
}

int main() {
    vector<int> arr = {14, 3, 27, 9, 41, 6};

    cout << "Index of 9  = " << linearSearch(arr, 9) << endl;
    cout << "Index of 14 = " << linearSearch(arr, 14) << endl;
    cout << "Index of 50 = " << linearSearch(arr, 50) << " (not found)" << endl;
    return 0;
}
