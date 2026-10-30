#include <iostream>
#include <vector>
using namespace std;

void printArray(const vector<int> &arr) {
    for (int x : arr) {
        cout << x << " ";
    }
    cout << endl;
}

void selectionSort(vector<int> &arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {        // scan the unsorted part
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        swap(arr[i], arr[minIdx]);               // one swap per pass
        cout << "pass " << i + 1 << ": min = " << arr[i] << " -> ";
        printArray(arr);
    }
}

int main() {
    vector<int> arr = {64, 25, 12, 22, 11};
    cout << "Before: ";
    printArray(arr);
    selectionSort(arr);
    cout << "After : ";
    printArray(arr);
    return 0;
}
