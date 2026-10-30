#include <iostream>
#include <vector>
using namespace std;

int indexOfMax(const vector<int> &arr) {
    int best = 0;                       // index of the biggest so far
    for (int i = 1; i < (int)arr.size(); i++) {
        if (arr[i] > arr[best]) {       // > keeps the FIRST maximum
            best = i;
        }
    }
    return best;
}

int main() {
    vector<int> arr = {23, 67, 12, 67, 45};
    int idx = indexOfMax(arr);
    cout << "Maximum " << arr[idx] << " is at index " << idx << endl;
    return 0;
}
