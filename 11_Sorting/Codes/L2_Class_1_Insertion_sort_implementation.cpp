#include <iostream>
#include <vector>
using namespace std;

void printArray(const vector<int> &arr) {
    for (int x : arr) {
        cout << x << " ";
    }
    cout << endl;
}

void insertionSort(vector<int> &arr) {
    int n = arr.size();
    for (int i = 1; i < n; i++) {
        int key = arr[i];                       // the card we pick up
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {        // shift bigger ones right
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;                       // drop it into the gap
        cout << "insert " << key << ": ";
        printArray(arr);
    }
}

int main() {
    vector<int> arr = {12, 11, 13, 5, 6};
    cout << "Before   : ";
    printArray(arr);
    insertionSort(arr);
    cout << "Sorted   : ";
    printArray(arr);
    return 0;
}
