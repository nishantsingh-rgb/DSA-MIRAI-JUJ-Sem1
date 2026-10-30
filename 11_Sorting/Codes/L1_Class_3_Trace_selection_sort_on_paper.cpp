#include <iostream>
#include <vector>
using namespace std;

// prints the sorted part, a bar, then the unsorted part
void showSplit(const vector<int> &arr, int sortedCount) {
    cout << "       ";
    for (int k = 0; k < (int)arr.size(); k++) {
        if (k == sortedCount) {
            cout << "| ";
        }
        cout << arr[k] << " ";
    }
    cout << endl;
}

int main() {
    vector<int> arr = {29, 10, 14, 37, 13};
    int n = arr.size();
    cout << "Start:" << endl;
    showSplit(arr, 0);

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        cout << "i = " << i << ": smallest in the unsorted part is " << arr[minIdx]
             << " (index " << minIdx << "), swap with index " << i << endl;
        swap(arr[i], arr[minIdx]);
        showSplit(arr, i + 1);
    }
    return 0;
}
