#include <iostream>
#include <algorithm>
#include <vector>
using namespace std;

void printArray(const vector<int> &v) {
    for (int x : v) {
        cout << x << " ";
    }
    cout << endl;
}

int main() {
    vector<int> v = {42, 7, 19, 3, 25, 11};

    sort(v.begin(), v.end());                       // ascending
    cout << "Ascending          : ";
    printArray(v);

    sort(v.begin(), v.end(), greater<int>());       // descending
    cout << "Descending         : ";
    printArray(v);

    sort(v.begin(), v.end(), [](int a, int b) {     // a lambda comparator
        return a < b;
    });
    cout << "Ascending (lambda) : ";
    printArray(v);

    int arr[] = {9, 4, 6, 1};
    sort(arr, arr + 4);                             // a plain array
    cout << "Plain array        : ";
    for (int i = 0; i < 4; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    return 0;
}
