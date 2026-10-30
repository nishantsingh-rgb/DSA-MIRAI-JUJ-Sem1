#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {34, 7, 89, 12, 56, 3, 71};
    int n = arr.size();

    int mx = arr[0], mn = arr[0];       // start with the first element
    int maxIdx = 0, minIdx = 0;
    for (int i = 1; i < n; i++) {
        if (arr[i] > mx) {
            mx = arr[i];
            maxIdx = i;
        }
        if (arr[i] < mn) {
            mn = arr[i];
            minIdx = i;
        }
    }
    cout << "Maximum = " << mx << " at index " << maxIdx << endl;
    cout << "Minimum = " << mn << " at index " << minIdx << endl;
    return 0;
}
